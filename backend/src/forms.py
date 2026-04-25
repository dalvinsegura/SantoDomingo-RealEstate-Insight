# src/forms.py
# Validación y procesamiento de formularios para inmuebles

from datetime import datetime


class InmuebleForm:
    """Formulario para crear/actualizar inmuebles con validación."""
    
    TIPOS_VALIDOS = ["Casa", "Apartamento", "Villa", "Comercio", "Terreno", "Penthouse", "Oficina"]
    ESTADOS_VALIDOS = ["disponible", "alquilada", "vendida", "en-tramite"]
    
    def __init__(self, datos):
        self.datos = datos
        self.errores = {}
        self.datos_limpios = {}
    
    def validar(self):
        """Valida todos los campos. Retorna True si es válido."""
        self._validar_titulo()
        self._validar_precio()
        self._validar_ubicacion()
        self._validar_area()
        self._validar_habitaciones()
        self._validar_banos()
        self._validar_tipo()
        self._validar_estado()
        self._validar_contacto()
        
        return len(self.errores) == 0
    
    def _validar_titulo(self):
        titulo = self.datos.get("titulo", "").strip()
        if not titulo:
            self.errores["titulo"] = "El título es obligatorio"
        elif len(titulo) < 5:
            self.errores["titulo"] = "El título debe tener al menos 5 caracteres"
        elif len(titulo) > 200:
            self.errores["titulo"] = "El título no puede exceder 200 caracteres"
        else:
            self.datos_limpios["titulo"] = titulo
    
    def _validar_precio(self):
        try:
            precio = float(self.datos.get("precio"))
            if precio < 0:
                self.errores["precio"] = "El precio no puede ser negativo"
            else:
                self.datos_limpios["precio"] = precio
        except (TypeError, ValueError):
            self.errores["precio"] = "El precio debe ser un número válido"
    
    def _validar_ubicacion(self):
        ubicacion = self.datos.get("ubicacion", "").strip()
        if not ubicacion:
            self.errores["ubicacion"] = "La ubicación es obligatoria"
        elif len(ubicacion) < 3:
            self.errores["ubicacion"] = "La ubicación debe tener al menos 3 caracteres"
        else:
            self.datos_limpios["ubicacion"] = ubicacion
    
    def _validar_area(self):
        try:
            area_m2 = float(self.datos.get("area_m2", 0))
            if area_m2 < 0:
                self.errores["area_m2"] = "El área no puede ser negativa"
            else:
                self.datos_limpios["area_m2"] = area_m2
        except (TypeError, ValueError):
            self.errores["area_m2"] = "El área debe ser un número válido"
    
    def _validar_habitaciones(self):
        try:
            hab = int(self.datos.get("habitaciones", 0))
            if hab < 0:
                self.errores["habitaciones"] = "Las habitaciones no pueden ser negativas"
            else:
                self.datos_limpios["habitaciones"] = hab
        except (TypeError, ValueError):
            self.errores["habitaciones"] = "Las habitaciones deben ser un número entero"
    
    def _validar_banos(self):
        try:
            banos = int(self.datos.get("banos", 0))
            if banos < 0:
                self.errores["banos"] = "Los baños no pueden ser negativos"
            else:
                self.datos_limpios["banos"] = banos
        except (TypeError, ValueError):
            self.errores["banos"] = "Los baños deben ser un número entero"
    
    def _validar_tipo(self):
        tipo = self.datos.get("tipo", "").strip()
        if not tipo:
            self.errores["tipo"] = "El tipo de propiedad es obligatorio"
        elif tipo not in self.TIPOS_VALIDOS:
            self.errores["tipo"] = f"Tipo inválido. Use uno de: {', '.join(self.TIPOS_VALIDOS)}"
        else:
            self.datos_limpios["tipo"] = tipo
    
    def _validar_estado(self):
        estado = self.datos.get("estado", "disponible").strip().lower()
        if estado not in self.ESTADOS_VALIDOS:
            self.errores["estado"] = f"Estado inválido. Use uno de: {', '.join(self.ESTADOS_VALIDOS)}"
        else:
            self.datos_limpios["estado"] = estado
    
    def _validar_contacto(self):
        contacto = self.datos.get("contacto", {})
        if isinstance(contacto, dict):
            contacto_limpio = {}
            if "nombre" in contacto:
                contacto_limpio["nombre"] = str(contacto["nombre"]).strip()
            if "telefono" in contacto:
                contacto_limpio["telefono"] = str(contacto["telefono"]).strip()
            if "email" in contacto:
                contacto_limpio["email"] = str(contacto["email"]).strip()
            if contacto_limpio:
                self.datos_limpios["contacto"] = contacto_limpio
    
    def get_datos_limpios(self):
        """Retorna los datos validados y limpios."""
        if not self.validar():
            return None
        
        # Añade campos opcionales si existen
        resultado = self.datos_limpios.copy()
        
        for campo_opcional in ["descripcion", "caracteristicas", "enlace", "fuente", "fechalizacion"]:
            if campo_opcional in self.datos:
                resultado[campo_opcional] = self.datos[campo_opcional]
        
        return resultado
