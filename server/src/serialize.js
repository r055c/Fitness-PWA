export function exerciseRowToJson(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    equipment: row.equipment,
    difficulty: row.difficulty,
    mechanic: row.mechanic,
    force: row.force,
    primaryMuscles: JSON.parse(row.primary_muscles),
    secondaryMuscles: JSON.parse(row.secondary_muscles),
    instructions: JSON.parse(row.instructions),
    tags: JSON.parse(row.tags),
    images: JSON.parse(row.images),
  };
}
