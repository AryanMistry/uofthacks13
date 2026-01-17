# 3D Furniture Models

This directory contains 3D furniture models in GLB format for the room visualization.

## Required Models

Download free GLB models from these sources and place them here:

### Furniture
- `sofa.glb` - 3-seater sofa
- `chair.glb` - Armchair
- `table.glb` - Dining table
- `coffee_table.glb` - Coffee table
- `desk.glb` - Office desk
- `bed.glb` - Double bed

### Storage
- `bookshelf.glb` - Tall bookshelf
- `wardrobe.glb` - Wardrobe/closet
- `cabinet.glb` - Storage cabinet

### Lighting
- `lamp.glb` - Floor lamp
- `ceiling_light.glb` - Ceiling light fixture

### Textiles
- `rug.glb` - Area rug

### Decorations
- `plant.glb` - Potted plant
- `vase.glb` - Decorative vase
- `tv.glb` - Television

## Free Model Sources

1. **Sketchfab** (CC licensed): https://sketchfab.com/search?features=downloadable&type=models
2. **Poly Pizza**: https://poly.pizza/
3. **Kenney Assets**: https://kenney.nl/assets?q=3d
4. **Google Poly Archive**: Various archives of the discontinued Google Poly
5. **Quaternius**: https://quaternius.com/packs.html (free low-poly packs)

## Quick Download Script

You can use the following models from Quaternius (free, CC0):

```bash
# Download Ultimate Furniture Pack
curl -L -o furniture.zip https://quaternius.com/packs/ultimatefurniture.zip
unzip furniture.zip -d temp_furniture
# Then manually copy the GLB files you need
```

## Model Requirements

- Format: GLB (binary glTF)
- Scale: Models should be roughly to scale in meters
- Origin: Center-bottom preferred (sitting on ground plane)
