import { Link } from "@tanstack/react-router";

import { KinoFacts } from "@/components/kino/KinoFacts";

import { Onboarding } from "@/components/ui/Onboarding";

import { buttonStyles } from "@/components/ui/Button";

import { Card, CardTitle } from "@/components/ui/Card";

import { Note } from "@/components/ui/Field";

import { NAV_GROUPS } from "@/components/layout/Nav";



/**

 * Inicio — andamiaje, no índice.

 *

 * Antes repetía en prosa los seis items del nav ("¿Qué puedes hacer aquí?"). Era la misma

 * información dos veces: el visitante leía la lista antes de tener contexto para entenderla.

 * Ahora la portada hace tres cosas: dice qué es el Kino, da el hecho que responde su

 * pregunta, y ofrece tres caminos con su verbo de acción.

 *

 * El aviso de juego responsable aparece UNA vez aquí y otra en el footer (persistente).

 * Estaba en cuatro sitios —portada, footer, README y un paso del onboarding— y repetido

 * cuatro veces un aviso de seguridad pierde peso y pasa a ser decoración.

 */

export function HomePage() {

  return (

    <div className="space-y-16">

      <Onboarding />



      <section className="mx-auto max-w-dashboard text-center">

        <p className="text-eyebrow font-medium uppercase text-accent-text">

          Kino Simulator · Lotería de Concepción

        </p>

        <h1 className="mx-auto mt-4 max-w-4xl font-display text-display font-medium text-ink-900">

          Entiende el Kino con <span className="text-accent-text">números duros</span>.

        </h1>

        <p className="mx-auto mt-6 max-w-prose text-body text-ink-600">

          Eliges <strong className="font-medium text-ink-900">14 números del 1 al 25</strong>; el sorteo extrae 14

          bolillas sin reposición y premia de 10 a 14 aciertos. Esta herramienta pone matemática exacta y

          simulaciones masivas al servicio de tu análisis.

        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">

          <Link to="/generador" className={buttonStyles({ variant: "primary", size: "lg" })}>

            Generar cartón

          </Link>

          <Link to="/simulador" className={buttonStyles({ variant: "secondary", size: "lg" })}>

            Simular sorteos

          </Link>

        </div>

      </section>



      <section>

        <KinoFacts />

      </section>



      <section>

        <h2 className="font-display text-h2 font-medium text-ink-900">Por dónde partir</h2>

        <p className="mt-2 max-w-prose text-body text-ink-600">

          Tres caminos según lo que quieras hacer. Puedes volver a cualquiera de ellos cuando quieras.

        </p>



        <div className="mt-6 grid gap-5 lg:grid-cols-3">

          {NAV_GROUPS.map((group, i) => {

            const [first, second] = group.items;

            return (

              <Card key={group.label} className="flex flex-col">

                <p className="text-eyebrow font-medium uppercase text-ink-500">

                  <span className="text-accent-text">{i + 1}.</span> {group.label}

                </p>

                <CardTitle className="mt-2.5">{first.label}</CardTitle>

                <p className="mt-2 flex-1 text-small leading-relaxed text-ink-600">{first.description}</p>



                <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4">

                  <Link

                    to={first.to}

                    className={buttonStyles({ variant: "primary", size: "sm", fullWidth: true })}

                  >

                    {first.label}

                  </Link>

                  <Link

                    to={second.to}

                    className={buttonStyles({ variant: "ghost", size: "sm", fullWidth: true })}

                  >

                    {second.label} →

                  </Link>

                </div>

              </Card>

            );

          })}

        </div>

      </section>



      <section className="mx-auto max-w-prose">

        <Note tone="warning" title="Lo que esta herramienta no hace">

          No predice números ganadores y no mejora tu probabilidad. Toda combinación de 14 números tiene exactamente la

          misma chance. Sirve para comprender riesgo y recompensa; jugar tiene costo real.

        </Note>

      </section>

    </div>

  );

}