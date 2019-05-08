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
                    // 'target-arrow-color': '#9dbaea'
                }
            },
        ],
        userZoomingEnabled: false,
    });
}

function calc_rank_cy(cy, arr, arrid) {
    for (let iter = arr.length - 1; iter >= 0; --iter) {
        if (arr[iter] == null) continue;
        let cur_id = arrid + arr[iter],
            left = 2 * iter + 1,
            right = 2 * iter + 2,
            left_rank = -1,
            right_rank = -1;

        if (left < arr.length && arr[left] != null) {
            left_rank = cy.$id(arrid + arr[left]).data()['rank'];
        }
        if (right < arr.length && arr[right] != null) {
            right_rank = cy.$id(arrid + arr[right]).data()['rank'];
        }

        if (iter == 0) {
            cy.$id(cur_id).data('rank', left_rank + 1);
        } else if (Math.abs(left_rank - right_rank) <= 1) {
            cy.$id(cur_id).data('rank', Math.max(left_rank, right_rank) + 1);
        } else {
            cy.$id(cur_id).data('rank', Math.max(left_rank, right_rank));
        }
    }
}

function add_tree_cy(cy, arr, arrid) {
    // console.log(arr);
    for (let i = 0; i < arr.length; ++i) {
        let elems = [];
        for (let j = 0; j < arr[i].length; ++j) {
            // console.log(arr[i][j]);
            if (arr[i][j] != null) {
                elems.push({
                    group: 'nodes',
                    data: {
                        id: arrid + i + arr[i][j],
                        val: arr[i][j],
                        rank: -1,
                    },
                });
            }
        }
        cy.add(elems);

        elems = [];
        for (let j = arr[i].length-1; j >= 0; --j) {
            if (arr[i][j] == null) continue;
            let cur_id = arrid + i + arr[i][j];
            let left = 2 * j + 1;
            let right = 2 * j + 2;
            let left_rank = -1, right_rank = -1;

            if (left < arr[i].length && arr[i][left] != null) {
                elems.push({
                    group: 'edges',
                    data: {
                        source: cur_id,
                        target: arrid + i + arr[i][left],
                    }
                });
            }
            if (right < arr[i].length && arr[i][right] != null) {
                elems.push({
                    group: 'edges',
                    data: {
                        source: cur_id,
                        target: arrid + i + arr[i][right],
                    }
                });
            }
        }
        cy.add(elems);
        calc_rank_cy(cy, arr[i], arrid+i);
    }

    // mark the minimum to be a different color
    cy.$id(arrid + '0' + arr[0][0]).style('background-color', '#333333');
    return cy;
}

function display_tree_cy(cy, label) {
    cy.nodeHtmlLabel([
        {
            query: 'node',
            halign: 'right',
            valign: 'center',
            tpl: label,
        },
    ]);

    cy.layout({name: 'dagre'}).run();
}


class RankPairingHeap {
    constructor() {
        this.arr = [];
        this.rank = [];
    }
    insert(arr) {
        if (this.arr.length == 0) {
            this.arr.push(arr);
        } else {
            if (this.arr[0][0] < arr[0]) {
                this.arr.push(arr);
            } else {
                this.arr.unshift(arr);
            }
        }
    }
    calc_rank() {
        // calculate rank for current half trees
        for (let i = 0; i < this.arr.length; ++i) {
            let temp_rank = Array(this.arr[i].length).fill(-1);
            for (let j = this.arr[i].length - 1; j >= 0; --j) {
                if (this.arr[i][j] == null) continue;
                let left = 2 * j + 1,
                    right = 2 * j + 2,
                    left_rank = (left < this.arr[i].length && this.arr[i][left] != null) ? temp_rank[left] : -1,
                    right_rank = (right < this.arr[i].length && this.arr[i][right] != null) ? temp_rank[right] : -1;

                temp_rank[j] = (j == 0) ? left_rank + 1 : (Math.abs(left_rank - right_rank) <= 1) ? Math.max(left_rank, right_rank) + 1 : Math.max(left_rank, right_rank);
            }
            // console.log(temp_rank);
            this.rank.push(temp_rank[0]);
        }
        console.log(this.rank);
    }
}

let rp = new RankPairingHeap();
let heap = [1,
            2, 3,
            4, 6, 7, 8,
            5, 10, null, null, null, null, null, null,
            9, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

let half = [1,
            2, null,
            4, 3, null, null,
            5, 6, 7, 8, null, null, null, null,
            9, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

rp.insert(half);

// should add to cy and display tree

let heap_cy = add_tree_cy(init_cy($('#cy-heap')), [heap], 'heap');
let half_cy = add_tree_cy(init_cy($('#cy-half')), rp.arr, 'half');

display_tree_cy(heap_cy, function (data) {
    return '<p class="cyid"> ' + data.val + '</p>';
});
display_tree_cy(half_cy, function (data) {
    return '<p class="cyid"> ' + data.val + '</p>';
});


let insert_cy = add_tree_cy(init_cy($('#cy-insert')), rp.arr, 'insert');
display_tree_cy(insert_cy, function (data) {
    return '<p class="cyid"> ' + data.val + '</p>';
});

$("#insert-form").submit(function() {
    if ($("#insert").val() == "") return;
    rp.insert([parseInt($("#insert").val(), 10)]);
    rp.calc_rank();
    insert_cy = add_tree_cy(init_cy($('#cy-insert')), rp.arr, 'insert');
    display_tree_cy(insert_cy, function (data) {
        return '<p class="cyid"> Val: ' + data.val + '</p>' +
               '<p class="cyrank"> Rank: ' + data.rank + '</p>';
    });
    $("#insert").val("");
    return false;
});






//
