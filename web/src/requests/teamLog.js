const t = (en, es) => ({ en, es });
export const VARIANT_OF = { web: 'web', logo: 'logo', video: 'video', piece: 'doc', social: 'doc', campaign: 'doc', study: 'doc' };
export const LOG = {
    web: {
        researcher: [t('Searching sites in your category…', 'Buscando sitios de tu categoría…'), t('Tagging references and competitors', 'Marcando referentes y competidores'), t('Writing down what works best', 'Anotando lo que mejor funciona')],
        marketer: [t('Mapping where competitors stand', 'Ubicando a la competencia en el mapa'), t('Finding the free space for your brand', 'Encontrando el espacio libre para tu marca'), t('Setting the goal of the site', 'Definiendo el objetivo del sitio')],
        creator: [t('Drawing the wireframe', 'Dibujando el wireframe'), t('Picking colors and type from your brand', 'Eligiendo colores y tipografía de tu marca'), t('Turning it into the mockup', 'Convirtiéndolo en mockup')],
        builder: [t('Writing the code', 'Escribiendo el código'), t('Building and testing', 'Compilando y probando'), t('Publishing the site', 'Publicando el sitio')],
    },
    logo: {
        researcher: [t('Collecting logos in your category…', 'Reuniendo logos de tu categoría…'), t('Spotting the visual codes everyone repeats', 'Detectando los códigos que todos repiten'), t('Noting where to stand out', 'Anotando dónde diferenciarse')],
        marketer: [t('Mapping competitor personalities', 'Ubicando la personalidad de la competencia'), t('Finding your brand’s place', 'Encontrando el lugar de tu marca'), t('Writing the concept', 'Escribiendo el concepto')],
        creator: [t('Sketching on the construction grid', 'Bocetando sobre la retícula'), t('Drawing the mark in vector', 'Trazando el símbolo en vector'), t('Applying color and the wordmark', 'Aplicando color y el logotipo')],
        builder: [t('Exporting every version', 'Exportando cada versión'), t('Checking sizes and contrast', 'Revisando tamaños y contraste'), t('Packing the brand kit', 'Empacando el kit de marca')],
    },
    video: {
        researcher: [t('Watching videos that perform in your sector…', 'Viendo videos que funcionan en tu sector…'), t('Marking hooks, pace and music', 'Marcando ganchos, ritmo y música'), t('Writing down the trends', 'Anotando las tendencias')],
        marketer: [t('Mapping what others say', 'Ubicando lo que dicen los demás'), t('Choosing the angle', 'Eligiendo el ángulo'), t('Writing the hook and the script', 'Escribiendo el gancho y el guion')],
        creator: [t('Drawing the storyboard', 'Dibujando el storyboard'), t('Laying clips on the timeline', 'Montando clips en la línea de tiempo'), t('Adding motion, subtitles and music', 'Agregando movimiento, subtítulos y música')],
        builder: [t('Rendering the video', 'Renderizando el video'), t('Exporting 9:16, 1:1 and 16:9', 'Exportando 9:16, 1:1 y 16:9'), t('Leaving it ready to publish', 'Dejándolo listo para publicar')],
    },
    doc: {
        researcher: [t('Gathering references and data…', 'Reuniendo referentes y datos…'), t('Tagging what fits your brand', 'Marcando lo que encaja con tu marca'), t('Writing down the findings', 'Anotando los hallazgos')],
        marketer: [t('Mapping the audience and the competition', 'Ubicando la audiencia y la competencia'), t('Choosing the message', 'Eligiendo el mensaje'), t('Ordering the call to action', 'Ordenando el llamado a la acción')],
        creator: [t('Setting the grid', 'Armando la retícula'), t('Placing images and text', 'Ubicando imágenes y textos'), t('Polishing the design', 'Puliendo el diseño')],
        builder: [t('Preparing the files', 'Preparando los archivos'), t('Checking every format', 'Revisando cada formato'), t('Leaving it ready to use', 'Dejándolo listo para usar')],
    },
};
/** Words drawn inside the scenes. */
export const WORDS = {
    ref: t('Reference', 'Referente'), rival: t('Competitor', 'Competidor'), good: t('Best practice', 'Buena práctica'),
    findings: t('Findings', 'Hallazgos'), you: t('Your brand', 'Tu marca'), goal: t('Goal', 'Objetivo'),
    premium: t('Premium', 'Premium'), budget: t('Accessible', 'Accesible'), classic: t('Classic', 'Clásico'), bold: t('Bold', 'Disruptivo'),
    live: t('Live', 'Publicado'), ready: t('Ready', 'Listo'), mockup: t('Mockup', 'Mockup'), wire: t('Wireframe', 'Wireframe'),
    aware: t('Discover', 'Descubre'), consider: t('Consider', 'Considera'), act: t('Act', 'Actúa'),
};
