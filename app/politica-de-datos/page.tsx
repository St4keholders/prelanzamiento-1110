import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Card, Shell } from "@/components/hub/Shell";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos · 11Diez",
};

/** Texto de la política enviado por el equipo 1110 (POLÍTICA DE TRATAMIENTO DE DATOS.docx). */
function H({ children }: { children: ReactNode }) {
  return <h2 className="mt-5 font-display text-base font-extrabold text-primary-dark">{children}</h2>;
}
function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-3 text-sm font-bold text-ink">{children}</h3>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm leading-relaxed text-ink">{children}</p>;
}
function L({ items }: { items: string[] }) {
  return (
    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export default function PoliticaDeDatosPage() {
  return (
    <Shell back={{ href: "/", label: "Inicio" }}>
      <Card>
        <h1 className="font-display text-xl font-extrabold text-primary-dark">
          Política de Tratamiento de Datos Personales
        </h1>

        <H>1. Introducción</H>
        <P>
          En cumplimiento de lo dispuesto por la Ley 1581 de 2012 y sus decretos reglamentarios, esta
          Política establece los lineamientos para el tratamiento de datos personales recolectados por{" "}
          <strong>11Diez</strong> a través de redes sociales, formularios, comunicaciones y demás canales
          oficiales.
        </P>
        <P>
          El objetivo de esta política es garantizar que los datos personales sean tratados de manera
          segura, confiable y respetando los derechos de los titulares.
        </P>

        <H>2. Datos que recolectamos</H>
        <P>
          Recolectamos datos personales de los usuarios con el fin de brindar nuestros servicios,
          incluyendo pero no limitados a:
        </P>
        <H3>2.1. Datos generales</H3>
        <L
          items={[
            "Nombres y apellidos",
            "Tipo y número de identificación",
            "Teléfono / WhatsApp",
            "Correo electrónico",
            "Ciudad y país de residencia",
          ]}
        />
        <H3>2.2. Datos derivados de navegación</H3>
        <L
          items={[
            "Dirección IP",
            "Cookies",
            "Preferencias de uso",
            "Historial de compras",
            "Tiempos de acceso y comportamiento dentro del sitio",
          ]}
        />

        <H>3. Finalidades del tratamiento</H>
        <P>Los datos recopilados se utilizan para las siguientes finalidades:</P>
        <H3>3.1. Finalidades comerciales</H3>
        <L
          items={[
            "Enviar actualizaciones de 11Diez.",
            "Gestionar solicitudes, peticiones, quejas y reclamos (PQRS).",
          ]}
        />
        <H3>3.2. Finalidades de marketing</H3>
        <L
          items={[
            "Enviar información sobre promociones, lanzamientos, campañas y eventos.",
            "Realizar análisis de preferencias para mejorar ofertas y experiencia de usuario.",
          ]}
        />
        <P>
          <em>
            El usuario puede solicitar retirar su correo o WhatsApp de nuestras listas de contacto en
            cualquier momento.
          </em>
        </P>
        <H3>3.3. Finalidades administrativas</H3>
        <L
          items={[
            "Cumplir obligaciones legales y contractuales.",
            "Generar reportes internos.",
            "Gestionar soporte técnico y atención al cliente.",
          ]}
        />
        <H3>3.4. Finalidades de seguridad digital</H3>
        <L
          items={[
            "Identificar accesos no autorizados.",
            "Prevenir fraude y suplantación de identidad.",
            "Mejorar la seguridad del sitio web.",
          ]}
        />

        <H>4. Tratamiento de datos sensibles</H>
        <P>
          <strong>11Diez</strong> no solicita datos sensibles, excepto cuando sean estrictamente
          necesarios y siempre con autorización explícita del titular.
        </P>
        <P>El usuario no está obligado a proporcionar datos sensibles.</P>

        <H>5. Autorización del titular</H>
        <P>
          El tratamiento de datos requiere autorización previa, expresa e informada del titular. Dicha
          autorización se obtiene mediante:
        </P>
        <L items={["Casillas de aceptación"]} />
        <P>El usuario puede revocar esta autorización en cualquier momento.</P>

        <H>6. Transmisión y transferencia de datos</H>
        <P>
          Podemos transmitir o transferir datos a terceros <strong>encargados</strong> únicamente para
          cumplir las finalidades mencionadas, tales como:
        </P>
        <L
          items={[
            "Pasarelas de pago",
            "Plataformas de envío de correos",
            "Servicios de hosting y almacenamiento",
            "Plataformas educativas o de gestión de cursos",
            "Patrocinadores del lanzamiento y aliados de 11diez",
          ]}
        />
        <P>En todos los casos, se exigirá el cumplimiento de normas de seguridad y protección de datos.</P>

        <H>7. Seguridad de la información</H>
        <P>
          Implementamos medidas técnicas, humanas y administrativas para proteger la información contra:
        </P>
        <L
          items={[
            "Accesos no autorizados",
            "Pérdida o destrucción",
            "Fuga o filtraciones",
            "Manipulación indebida",
          ]}
        />
        <P>Ningún sistema es 100% infalible, pero adoptamos prácticas robustas de protección.</P>

        <H>8. Vigencia de la política</H>
        <P>
          La presente Política de Tratamiento estará vigente desde su publicación y podrá ser modificada
          en cualquier momento. Las modificaciones serán publicadas en nuestra página web.
        </P>
        <P>
          La información personal será tratada mientras la relación con el titular permanezca activa o sea
          necesaria para cumplir las finalidades establecidas.
        </P>
      </Card>
    </Shell>
  );
}
