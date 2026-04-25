# src/database/test_data.py
# Datos de prueba para inicializar la base de datos con inmuebles ejemplo

from . import crud


SAMPLE_PROPERTIES = [
    {
        "titulo": "Casa moderna en La Romana",
        "precio": 450000,
        "ubicacion": "La Romana, Santo Domingo",
        "area": 250,
        "habitaciones": 4,
        "banos": 3,
        "tipo": "Casa",
        "descripcion": "Hermosa casa de dos pisos con piscina y jardín amplio",
        "caracteristicas": ["Piscina", "Jardín", "Garaje", "Aire acondicionado"],
        "contacto": {"nombre": "Juan Pérez", "telefono": "+1-809-555-0101", "email": "juan@ejemplo.com"}
    },
    {
        "titulo": "Apartamento con vista al mar",
        "precio": 250000,
        "ubicacion": "San Isidro, Santo Domingo",
        "area": 120,
        "habitaciones": 3,
        "banos": 2,
        "tipo": "Apartamento",
        "descripcion": "Apartamento moderno con balcón y vista panorámica al mar Caribe",
        "caracteristicas": ["Vista al mar", "Terraza", "Aire acondicionado", "Seguridad 24/7"],
        "contacto": {"nombre": "María González", "telefono": "+1-809-555-0102", "email": "maria@ejemplo.com"}
    },
    {
        "titulo": "Villa de lujo en Punta Cana",
        "precio": 850000,
        "ubicacion": "Punta Cana, La Altagracia",
        "area": 400,
        "habitaciones": 5,
        "banos": 4,
        "tipo": "Villa",
        "descripcion": "Villa exclusiva en zona turística con acceso a resorts",
        "caracteristicas": ["Piscina privada", "Campo de golf cercano", "Seguridad privada", "Personal doméstico"],
        "contacto": {"nombre": "Carlos López", "telefono": "+1-809-555-0103", "email": "carlos@ejemplo.com"}
    },
    {
        "titulo": "Local comercial céntrico",
        "precio": 180000,
        "ubicacion": "Centro, Santo Domingo",
        "area": 80,
        "habitaciones": 0,
        "banos": 1,
        "tipo": "Comercio",
        "descripcion": "Local ideal para negocio retail o oficina en zona comercial",
        "caracteristicas": ["Ubicación estratégica", "Alto flujo peatonal", "Estacionamiento", "Seguridad"],
        "contacto": {"nombre": "Ana Martínez", "telefono": "+1-809-555-0104", "email": "ana@ejemplo.com"}
    },
    {
        "titulo": "Terreno para desarrollo",
        "precio": 220000,
        "ubicacion": "Los Alcarrizos, Santo Domingo",
        "area": 5000,
        "habitaciones": 0,
        "banos": 0,
        "tipo": "Terreno",
        "descripcion": "Terreno grande con uso permitido residencial y comercial",
        "caracteristicas": ["Esquina favorable", "Acceso vial", "Servicios disponibles"],
        "contacto": {"nombre": "Roberto Díaz", "telefono": "+1-809-555-0105", "email": "roberto@ejemplo.com"}
    },
    {
        "titulo": "Penthouse en torre residencial",
        "precio": 650000,
        "ubicacion": "Naco, Santo Domingo",
        "area": 280,
        "habitaciones": 4,
        "banos": 3,
        "tipo": "Penthouse",
        "descripcion": "Penthouse de lujo en torre de 25 pisos con amenidades premium",
        "caracteristicas": ["Terrazas amplias", "Piscina común", "Gym", "SPA", "Seguridad 24/7"],
        "contacto": {"nombre": "Diana Fernández", "telefono": "+1-809-555-0106", "email": "diana@ejemplo.com"}
    },
    {
        "titulo": "Casa de campo en Higüey",
        "precio": 320000,
        "ubicacion": "Higüey, La Altagracia",
        "area": 300,
        "habitaciones": 3,
        "banos": 2,
        "tipo": "Casa",
        "descripcion": "Propiedad rural con hectáreas de terreno para ganadería o agricultura",
        "caracteristicas": ["Terreno agrícola", "Pozo de agua", "Acceso vial", "Tranquilidad"],
        "contacto": {"nombre": "Fernando Ruiz", "telefono": "+1-809-555-0107", "email": "fernando@ejemplo.com"}
    },
    {
        "titulo": "Oficina ejecutiva en zona bancaria",
        "precio": 95000,
        "ubicacion": "Gazcue, Santo Domingo",
        "area": 60,
        "habitaciones": 0,
        "banos": 1,
        "tipo": "Oficina",
        "descripcion": "Oficina moderna para profesionales o pequeñas empresas",
        "caracteristicas": ["Moderna", "Amueblada", "Internet de fibra", "Estacionamiento"],
        "contacto": {"nombre": "Patricia Sánchez", "telefono": "+1-809-555-0108", "email": "patricia@ejemplo.com"}
    }
]


def load_test_data():
    """
    Carga los datos de prueba en la base de datos.
    Si ya existen datos, no hace nada.
    """
    # Verifica si ya hay datos
    if crud.contar_inmuebles() > 0:
        print("La base de datos ya contiene datos. Saltando carga de datos de prueba.")
        return
    
    # Inserta los datos de prueba
    inserted_ids = []
    for prop in SAMPLE_PROPERTIES:
        try:
            id_ = crud.crear_inmueble(prop)
            inserted_ids.append(id_)
        except Exception as e:
            print(f"Error insertando propiedad {prop['titulo']}: {e}")
    
    print(f"Se cargaron {len(inserted_ids)} inmuebles de prueba.")
    return inserted_ids


def clear_test_data():
    """Borra todos los inmuebles de la base de datos."""
    # Para borrar, necesitamos obtener todos los ids y eliminar uno por uno
    inmuebles = crud.listar_inmuebles(limite=1000)
    deleted = 0
    for prop in inmuebles:
        if crud.eliminar_inmueble(prop["id"]):
            deleted += 1
    print(f"Se eliminaron {deleted} inmuebles.")


if __name__ == "__main__":
    print("Cargando datos de prueba...")
    load_test_data()
    print("Datos de prueba cargados correctamente.")
