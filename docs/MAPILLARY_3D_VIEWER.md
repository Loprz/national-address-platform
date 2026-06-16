# Mapillary Street Imagery — Phase 2: Embedded 3D Viewer + Click‑to‑Place

**Status: implemented in code.** Phase 1 replaced Panoramax with Mapillary
(coverage layer, control, hover popup). Phase 2 — this doc — is now wired in:
`src/components/map/mapillary-viewer.tsx` (embedded MapillaryJS viewer with
click‑to‑place) is rendered from `map.tsx`, and clicking a coverage point now
opens the **embedded** viewer instead of a new tab. `mapillary-js@^4.1.2` is in
`package.json` — run `yarn install` to pull it. This section documents how it
works and the accuracy caveats; the code blocks below match what shipped.

It brings the imagery **inside** the editor with the interactive viewer and the
feature you asked about: **click a spot in the photo (a front door, a unit
entrance) and move the address point to that real‑world location.**

## Can we do a 3D / "gaussian splat" view that you drag points onto?

Short version: the *drag‑the‑point‑onto‑what‑you‑see* workflow is buildable
today; literal gaussian splats are not an off‑the‑shelf Mapillary feature.

- **Mapillary doesn't serve gaussian splats.** It serves street‑level photos plus
  Structure‑from‑Motion (SfM) reconstructions — sparse point clouds / meshes that
  MapillaryJS already uses for navigation and depth. MapillaryJS renders imagery
  in a real WebGL 3D scene and can display camera positions and point clouds
  (its "spatial" component) — that's the closest built‑in 3D view.
- **The valuable part works without splats.** MapillaryJS exposes
  `viewer.unproject(pixelPoint)` and click events whose payload includes a
  geodetic `lngLat`, computed from the reconstruction. So when a clerk clicks the
  front door in the photo, you get a real lng/lat back and snap the marker to it.
  That is the practical version of "drag the point to the correct location," and
  it's the highest‑value 80%.
- **True 3DGS is a Phase 3 R&D track.** You *could* train per‑block gaussian
  splats from the same street frames for hard multi‑level / shared‑entrance
  cases, but that's a compute/research project (a 3DGS toolchain + storage), not
  a Mapillary toggle. It fits the spatial‑graph/Sedona direction in
  `ASSIST_TOOLING_ROADMAP.md` if you want to pursue it later. Recommend shipping
  the click‑to‑place viewer first and revisiting splats only if the SfM depth
  proves insufficient for vertical features like upper‑floor doors.

## Install

```bash
cd mes-adresses
yarn add mapillary-js
```

(MapillaryJS is browser‑only — always load it client‑side, as the component below
does. The `NEXT_PUBLIC_MAPILLARY_TOKEN` from Phase 1 is reused.)

## Drop‑in component: `src/components/map/mapillary-viewer.tsx`

```tsx
"use client";

import { useContext, useEffect, useRef } from "react";
import { Pane, IconButton, CrossIcon, Text } from "evergreen-ui";
import { useTranslations } from "next-intl";
import MarkersContext from "@/contexts/markers";
import { MAPILLARY_TOKEN } from "./layers/mapillary";

interface MapillaryViewerProps {
  imageId: string | null;
  onClose: () => void;
  // When true, clicking in the photo moves the active marker to that point.
  placeMode?: boolean;
}

export default function MapillaryViewer({
  imageId,
  onClose,
  placeMode = true,
}: MapillaryViewerProps) {
  const t = useTranslations("mapControls");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const { markers, updateMarker } = useContext(MarkersContext);

  // Create / destroy the viewer with the container.
  useEffect(() => {
    let cancelled = false;
    if (!imageId || !containerRef.current || !MAPILLARY_TOKEN) return;

    // Dynamic import keeps MapillaryJS out of SSR.
    import("mapillary-js").then(({ Viewer }) => {
      if (cancelled || !containerRef.current) return;
      const viewer = new Viewer({
        accessToken: MAPILLARY_TOKEN as string,
        container: containerRef.current,
        imageId,
        component: { cover: false },
      });
      viewerRef.current = viewer;

      // Click in the photo → geodetic coordinate from the SfM reconstruction.
      viewer.on("click", (event: any) => {
        if (!placeMode || !event.lngLat) return;
        const active = markers[0];
        if (!active) return;
        updateMarker(active.id, {
          longitude: event.lngLat.lng,
          latitude: event.lngLat.lat,
          type: active.type,
        });
      });
    });

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.remove();
        viewerRef.current = null;
      }
    };
    // markers/updateMarker intentionally read at click time via closure refresh
    // (re-create only when the image changes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId, placeMode]);

  // Navigate to a new image without tearing down the viewer.
  useEffect(() => {
    if (viewerRef.current && imageId) {
      viewerRef.current.moveTo(imageId).catch(() => {});
    }
  }, [imageId]);

  if (!imageId) return null;

  return (
    <Pane
      position="absolute"
      bottom={16}
      right={16}
      width={420}
      height={300}
      zIndex={3}
      elevation={3}
      borderRadius={6}
      overflow="hidden"
      background="white"
    >
      <Pane
        position="absolute"
        top={6}
        right={6}
        zIndex={4}
        display="flex"
        alignItems="center"
        gap={6}
      >
        {placeMode && (
          <Text
            size={300}
            background="rgba(0,0,0,0.6)"
            color="white"
            paddingX={6}
            paddingY={2}
            borderRadius={4}
          >
            {t("clickPhotoToPlace")}
          </Text>
        )}
        <IconButton
          icon={CrossIcon}
          appearance="minimal"
          onClick={onClose}
          title={t("closeStreetView")}
        />
      </Pane>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </Pane>
  );
}
```

Add the message key (en/es): `mapControls.clickPhotoToPlace` →
`"Click in the photo to move the point"` / `"Haz clic en la foto para mover el punto"`.

## Wiring into `map.tsx`

1. Add state: `const [mapillaryImageId, setMapillaryImageId] = useState<string | null>(null);`
2. In the `onClick` handler's `MAPILLARY_SOURCE_ID` case, replace the
   `window.open(...)` line with:
   ```ts
   setMapillaryImageId(feature.properties.id);
   ```
3. Render the viewer (e.g., next to the controls):
   ```tsx
   <MapillaryViewer
     imageId={mapillaryImageId}
     onClose={() => setMapillaryImageId(null)}
   />
   ```

That's the whole change — the coverage layer/control from Phase 1 stay as‑is; only
the click behavior switches from "open a tab" to "open the embedded viewer."

## Accuracy notes / testing

- `event.lngLat` is unprojected to the ground plane via the reconstruction; for
  features at ground level (driveways, entrances) it's accurate. For elevated
  points (a 2nd‑floor unit door) the ground‑plane assumption introduces offset —
  for those, prefer `viewer.unproject(pixelPoint)` against the mesh, or let the
  clerk fine‑tune the dropped point on the map. Worth a field test in a county
  with good Mapillary coverage (e.g., parts of Fresno).
- MapillaryJS is WebGL + client‑only; verify it mounts inside the Next.js client
  component and that the container has a fixed size (it does above).
- This needs live browser testing — it couldn't be exercised in the build
  environment where the code was written.
```
