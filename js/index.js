var cy = cytoscape({
    container: $('#cy'),
    style: [
        {
            selector: 'node',
            style: {
                'label': 'data(id)',
                'text-valign': 'center',
                'text-halign': 'right',
            }
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                // 'width': 4,
                // 'target-arrow-shape': 'triangle',
                // 'line-color': '#9dbaea',
                // 'target-arrow-color': '#9dbaea'
            }
        },
    ],
    userZoomingEnabled: false,
});

var elems = [];

for (i = 0; i < 5; ++i) {
    elems.push({
        group: 'nodes',
        data: {
            id: i.toString(10),
        }
    });

    if (i > 1) {
        elems.push({
            group: 'edges',
            data: {
                id: 'e' + (i-2).toString(10),
                source: (i-2).toString(10),
                target: (i).toString(10),
            }
        });
    }

    if (i < 4) {
        elems.push({
            group: 'edges',
            data: {
                id: 'e' + (i+1).toString(10),
                source: (i+1).toString(10),
                target: (i).toString(10),
            },
        });
    }
}
cy.add(elems);

cy.layout({ name: 'dagre' }).run();
