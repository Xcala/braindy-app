const t = (en, es) => ({ en, es });
export const RELAY = ['researcher', 'marketer', 'creator', 'builder'];
export const KIND_OF = { web: 'web', ai: 'web', branding: 'logo', graphic: 'piece', multimedia: 'video', social: 'social', marketing: 'campaign', other: 'study' };
export const TASKS = {
    web: {
        researcher: t('Finds references, best practices and what competitors do', 'Busca referentes, mejores prácticas y qué hace la competencia'),
        marketer: t('Defines positioning and the goal of the site', 'Define el posicionamiento y el objetivo del sitio'),
        creator: t('Draws the layouts, then the mockup', 'Dibuja los layouts y luego el mockup'),
        builder: t('Builds it in code and publishes it', 'Lo construye en código y lo publica'),
    },
    logo: {
        researcher: t('Studies the category, competitors and visual codes', 'Estudia la categoría, la competencia y los códigos visuales'),
        marketer: t('Sets the concept and what the brand must say', 'Fija el concepto y lo que la marca debe decir'),
        creator: t('Sketches routes and draws the logo', 'Boceta rutas y dibuja el logo'),
        builder: t('Builds the files and the applications', 'Arma los archivos y las aplicaciones'),
    },
    piece: {
        researcher: t('Gathers references and the brand rules', 'Reúne referentes y las reglas de la marca'),
        marketer: t('Orders the message and the call to action', 'Ordena el mensaje y el llamado a la acción'),
        creator: t('Lays out and designs each page', 'Diagrama y diseña cada página'),
        builder: t('Prepares the print and digital files', 'Prepara los archivos para imprimir y para digital'),
    },
    video: {
        researcher: t('Looks for references, tone and trends', 'Busca referentes, tono y tendencias'),
        marketer: t('Writes the hook and the script', 'Escribe el gancho y el guion'),
        creator: t('Storyboards, animates and edits', 'Hace el storyboard, anima y edita'),
        builder: t('Exports every format, ready to publish', 'Exporta cada formato, listo para publicar'),
    },
    social: {
        researcher: t('Checks what works in your sector', 'Revisa qué funciona en tu sector'),
        marketer: t('Picks the angle and writes the copy', 'Elige el ángulo y escribe el copy'),
        creator: t('Designs the pieces', 'Diseña las piezas'),
        builder: t('Sizes each piece for every network', 'Adapta cada pieza a cada red'),
    },
    campaign: {
        researcher: t('Studies the audience and the competitors', 'Estudia la audiencia y la competencia'),
        marketer: t('Plans the funnel, the budget and the metrics', 'Planea el embudo, el presupuesto y las métricas'),
        creator: t('Designs the creatives', 'Diseña las creatividades'),
        builder: t('Sets up the tracking and the automations', 'Configura la medición y las automatizaciones'),
    },
    study: {
        researcher: t('Researches the case in depth', 'Investiga el caso a fondo'),
        marketer: t('Turns the findings into a strategy', 'Convierte los hallazgos en estrategia'),
        creator: t('Puts it in a clear, visual document', 'Lo pone en un documento claro y visual'),
        builder: t('Leaves it ready to use and share', 'Lo deja listo para usar y compartir'),
    },
};
