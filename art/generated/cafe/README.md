# Cafe art v1

Generated using the built-in image_gen tool from art/mockup-refs/cafe, with public/assets/food/sushi/1.png as the food rendering reference. Review assets; not wired into the game yet.

## sprites-v1.png

4 columns × 4 rows, row-major order. Coordinates below are 1-based.

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | --- | --- | --- | --- |
| 1 | batter | pancake | butter | syrup |
| 2 | strawberries | blueberries | berries | macaron-pink |
| 3 | macaron-yellow | macaron-green | final-pancakes-strawberry | final-pancakes-blueberry |
| 4 | final-macaron-tower | plate | mat | icons/pan |

Ingredient icons reuse the corresponding food cells. Inspect padding before extracting cells for production use.

## backgrounds-v1.png

Two stacked panels: counter above, dining below. Each panel is approximately 16:9.

## Scope

First folder: cafe. The diner, italian, and thai sets are also available in sibling folders.
