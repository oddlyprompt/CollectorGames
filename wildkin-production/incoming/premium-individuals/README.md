# Wildkin individual premium artwork — Claude handoff

Extract all ZIPs from the repository root. Each archive adds files under wildkin-production/incoming/premium-individuals/. Archives are independent ordinary ZIPs, not split-volume archives.

40 single full-bleed PNGs map one-to-one to cards WK-S001-141 through WK-S001-180. 36 were newly generated individually from prior sheet references; four existing SIR paintings were retained because they were already individual. No sheet crops or interpolated enlargements are used as new illustrations. Every supplied PNG is natively 1060 x 1484, exactly 5:7.

## Resolution results

- 36 ordinary premium images exceed the original per-painting minimum of 700 x 980. The previous low-resolution 3x3 sheet problem is fixed for these assets.
- Four SIR singles (173–176) remain below the original 1500 x 2100 print requirement. Their status is explicitly recorded as below_original_SIR_print_requirement. Do not mark them print-approved or silently lower that threshold. They remain available for browser preview.
- The image tool returned 1060 x 1484 despite a larger requested size. No print resolution is being claimed beyond those actual pixels.

## Integration

Use card-map.csv and card-map.json. Each record supplies card ID, asset ID, original task, original cell and PNG path. Names and IDs are authoritative mappings from the existing art queue. The manifest is not modified.

The current art checker expects original 3x3 task sheets or SIR singles. These separate files are deliberately delivered in a nested folder rather than disguised as sheets. Either add explicit single-premium intake using the mapping, or assemble original task sheets deterministically from these images before running the existing checker. Do not split these single paintings into 3x3 again. Preserve their aspect ratio. Leave the original task's unused cells empty. Do not overwrite approved registry assets automatically.

Before approval, compare each creature or character to its canon cutout and preview actual card name/text overlays. These are art deliveries, not a claim that the game was rebuilt or every composition passed its final overlay review. Some full-body characters extend beyond the ideal middle-half text-safe area; assess with the renderer. Candicoil IR's extra face eyes were corrected: only the two stalk-tip eyes remain.

The metadata directory includes per-image generation prompts, provenance and checksums. All ZIP files are below 30,000,000 bytes.
