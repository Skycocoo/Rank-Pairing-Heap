var cy = cytoscape({
    container: $('#cy'),
    style: [
    {
        selector: 'node',
        style: {
          'label': 'data(id)'
        }
    }
    ],
    userZoomingEnabled: false,
});

var elems = [];

for (i = 0; i < 5; ++i) {
    var node = {
        group: 'nodes',
        data: {
            id: i.toString(10),
        }
    };
    elems.push(node);

    if (i == 4) {
        break;
    }

    var edge = {
        group: 'edges',
        data: {
            id: 'e' + (i+1).toString(10),
            source: (i+1).toString(10),
            target: (i).toString(10),
        },
    };
    elems.push(edge);
}
cy.add(elems);

cy.layout({ name: 'grid' }).run();
