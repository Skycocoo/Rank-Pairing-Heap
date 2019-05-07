var cy = cytoscape({
    container: $('#cy'),
    style: [
        {
            selector: 'node',
            style: {
                // 'label': 'data(rank)' + 'data(id)',
                'text-valign': 'top',
                'text-halign': 'right',
            }
        },
        {
            selector: 'edge',
            style: {
                'curve-style': 'bezier',
                // 'width': 4,
                'target-arrow-shape': 'triangle',
                'line-color': '#9dbaea',
                'target-arrow-color': '#9dbaea'
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
            id: i,
            val: i,
            rank: 0,
        }
    });

    if (i > 1) {
        elems.push({
            group: 'edges',
            data: {
                source: (i-2).toString(10),
                target: (i).toString(10),
            }
        });
    }

    if (i < 4) {
        elems.push({
            group: 'edges',
            data: {
                source: (i+1).toString(10),
                target: (i).toString(10),
            },
        });
    }
}
cy.add(elems);

nodes = cy.nodes();
console.log(nodes[0]);

cy.nodeHtmlLabel([
    {
        query: 'node',
        halign: 'right',
        valign: 'center',
        tpl: function (data) {
            // return 'Val: ' + data.id + '\nRank:' + data.rank;
            return '<p class="cyid"> Val: ' + data.id + '</p>' +
                   '<p class="cyrank"> Rank: ' + data.rank + '</p>';
        }
    },
]);



cy.layout({name: 'dagre'}).run();
