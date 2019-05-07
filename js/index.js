function init_cy(cont) {
    return cytoscape({
        container: cont,
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
}

function calc_rank_cy(cy, arr, arrid) {
    for (i = arr.length - 1; i >= 0; --i) {
        if (arr[i] != null) {
            let cur_id = arrid + arr[i];
            let left = 2 * i + 1;
            let right = 2 * i + 2;
            let left_rank = -1, right_rank = -1;

            if (left < arr.length && arr[left] != null) {
                left_rank = cy.$id(arrid + arr[left]).data()['rank'];
            }
            if (right < arr.length && arr[right] != null) {
                right_rank = cy.$id(arrid + arr[right]).data()['rank'];
            }

            if (i == 0) {
                cy.$id(cur_id).data('rank', left_rank + 1);
            } else if (Math.abs(left_rank - right_rank) <= 1) {
                cy.$id(cur_id).data('rank', Math.max(left_rank, right_rank) + 1);
            } else {
                cy.$id(cur_id).data('rank', Math.max(left_rank, right_rank));
            }
        }
    }
}

function add_tree_cy(cy, arr, arrid) {
    let level = Math.ceil(Math.log(arr.length));
    let last_level = Math.pow(2, level) - 1;

    // add nodes to the graph
    let elems = [];
    for (i = 0; i < arr.length; ++i) {
        if (arr[i] != null) {
            elems.push({
                group: 'nodes',
                data: {
                    id: arrid + arr[i],
                    val: arr[i],
                    rank: -1,
                },
            });
        }
    }
    cy.add(elems);

    elems = [];
    for (i = arr.length - 1; i >= 0; --i) {
        if (arr[i] != null) {
            let cur_id = arrid + arr[i];
            let left = 2 * i + 1;
            let right = 2 * i + 2;
            let left_rank = -1, right_rank = -1;

            if (left < arr.length && arr[left] != null) {
                elems.push({
                    group: 'edges',
                    data: {
                        source: cur_id,
                        target: arrid + arr[left],
                    }
                });
            }
            if (right < arr.length && arr[right] != null) {
                elems.push({
                    group: 'edges',
                    data: {
                        source: cur_id,
                        target: arrid + arr[right],
                    }
                });
            }
        }
    }
    cy.add(elems);

    calc_rank_cy(cy, arr, arrid);

    return cy;
}

function display_tree_cy(cy) {
    cy.nodeHtmlLabel([
        {
            query: 'node',
            halign: 'right',
            valign: 'center',
            tpl: function (data) {
                // return 'Val: ' + data.id + '\nRank:' + data.rank;
                return '<p class="cyid"> Val: ' + data.val + '</p>' +
                       '<p class="cyrank"> Rank: ' + data.rank + '</p>';
            }
        },
    ]);

    cy.layout({name: 'dagre'}).run();
}


// let cy = init_cy($('#cy'));

let arr = [1,
            2, 3,
            4, 6, 7, 8,
            5, 10, null, null, null, null, null, null,
            9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];
let half = [1,
            2, null,
            4, 3, null, null,
            5, 6, 7, 8, null, null, null, null,
            9, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

// should add to cy and display tree

let arr_cy = add_tree_cy(init_cy($('#cy-arr')), arr, 'arr');
let half_cy = add_tree_cy(init_cy($('#cy-half')), half, 'half');

display_tree_cy(arr_cy);
display_tree_cy(half_cy);

// should calculate rank based on nodes and edges
// calc_rank_cy(arr_cy);
