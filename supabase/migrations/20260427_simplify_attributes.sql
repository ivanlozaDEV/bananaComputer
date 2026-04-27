-- Migración para simplificar el sistema de atributos
-- Mueve todos los atributos al nivel de categoría y elimina la dependencia de subcategorías

-- 1. Asegurar que todos los atributos sean 'Generales' (pertenezcan a la categoría y no a una subcategoría)
UPDATE attribute_definitions SET subcategory_id = NULL;

-- 2. Eliminar la columna de subcategoría de las definiciones de atributos
-- Esto consolida que los atributos son una propiedad global de la categoría.
ALTER TABLE attribute_definitions DROP COLUMN IF EXISTS subcategory_id;

-- NOTA: Las subcategorías en la tabla 'subcategories' permanecen intactas, 
-- ya que pueden seguir usándose para etiquetar productos (ej. "Gaming", "Estudiantes"),
-- pero ya no definen qué campos aparecen en el modal.
