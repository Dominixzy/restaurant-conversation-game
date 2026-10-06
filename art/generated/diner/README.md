# diner art v1

Generated with built-in image_gen. Food style reference: public/assets/food/sushi/1.png. Composition references: art/mockup-refs/diner.

## Sprite sheet

sprites-v1.png: 5 columns × 5 rows; positions are row-major. Transparent PNG. Review sheet; not integrated into the game. Inspect cell padding and edges before production extraction.

| Row | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| 1 | bun-bottom | bun-top | lettuce | tomato | cheese |
| 2 | patty-raw | patty-seasoned | patty | potato | potato-peeled |
| 3 | potato-sticks | fries | salt | final-cheeseburger | final-cheeseburger-no-lettuce |
| 4 | final-fries | final-fries-no-salt | plate | mat | icons/grill |
| 5 | icons/peeler | icons/season | icons/fryer | empty | empty |

Ingredient icons reuse matching food cells. Italian icons/sauce uses sauce-puddle; Thai icons/tomato uses cherry-tomato.

## Background sheet

backgrounds-v1.png: top panel counter, bottom panel dining. Two approximately 16:9 scenes stacked vertically.

Exact generation prompts are saved in prompts.txt.

