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

    if (arr.length > 0) {
        // mark the minimum to be a different color
        cy.$id(arrid + '0' + arr[0][0]).style('background-color', '#333333');
    }
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
    // get_min() {
    //     return this.arr[0][0];
    // }

    // ------------------- operations -------------------

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
        this.calc_rank();
    }

    decrease_key(key, new_key) {
        let result = this.find_key(key);
        if (result == undefined) {
            console.log("key does not exist");
            return;
        }

        let arr_ind = result[0],
            index = result[1];

        if (this.arr[arr_ind][index] < new_key) {
            console.log("should not increment key");
            return;
        }

        // assign the new key
        this.arr[arr_ind][index] = new_key;
        // if decrease key of a root: no need to continue
        if (index != 0) {
            let subtree = this.get_sub_tree(this.arr[arr_ind], index),
                right_spine = this.get_sub_tree(this.arr[arr_ind], 2 * index + 2);

            // clear up original subtree under parent
            this.clear_sub_tree(this.arr[arr_ind], index);
            this.clear_right_spine(subtree);

            // copy the right spine of tree to the location of index
            this.attach_sub_tree(this.arr[arr_ind], index, right_spine);
            subtree = this.restore_arr(subtree);

            // add the decreased subtree
            this.insert(subtree);
        }
        // link all pairs of roots with same rank
        this.link_trees();
        // recalculate rank for each half-tree
        this.restore_min();
        this.calc_rank();
    }

    extract_min() {
        // remove min
        let tree = this.get_sub_tree(this.arr[0], 1);
        this.arr.shift();

        // attach all right spines recursively
        let right_ind = 2,
            right_spines = [tree];
        while (right_ind < tree.length) {
            right_spines.push(this.restore_arr(this.get_sub_tree(tree, right_ind)));
            right_ind = 2 * right_ind + 2;
        }

        // last element of right spines is always [null] // no
        for (let i = 0; i < right_spines.length; ++i) {
            // this.clear_right_spine(right_spines[i]);
            // this.insert(right_spines[i]);
            let isnull = true;
            for (let j = 0; j < right_spines[i].length; ++j) {
                if (right_spines[i][j] != null) {
                    isnull = false;
                    break;
                }
            }
            if (!isnull) {
                this.clear_right_spine(right_spines[i]);
                this.insert(right_spines[i]);
            }
        }
        // recalculate rank for each half-tree
        this.restore_min();
        this.calc_rank();
    }


    // ------------------- helper functions -------------------

    link_trees() {
        let bucket = Array(Math.max(...this.rank)+1).fill(-1),
            new_arr = [];
        for (let i = 0; i < this.rank.length; ++i) {
            if (bucket[this.rank[i]] == -1) {
                bucket[this.rank[i]] = i;
            } else {
                // store newly-lined trees
                new_arr.push(this.link_tree(this.arr[i],
                                            this.arr[bucket[this.rank[i]]]));
                bucket[this.rank[i]] = -1;
            }
        }

        for (let i = 0; i < bucket.length; ++i) {
            if (bucket[i] != -1) {
                // store all non-linked trees
                new_arr.push(this.arr[bucket[i]].slice(0));
            }
        }

        // update arr to be new arr
        this.arr = new_arr;

        // update rank at the end;
        this.restore_min();
        this.calc_rank();
    }

    link_tree(h1, h2) {
        // console.log("link tree: ");
        h1 = this.restore_arr(h1);
        h2 = this.restore_arr(h2);
        // console.log(h1, h2, this.arr);

        // only link two trees with same rank
        let smaller = (h1[0] < h2[0]) ? h1 : h2,
            larger = (h1[0] < h2[0]) ? h2 : h1,
            h = Array(Math.max(h1.length, h2.length) * 2 + 1).fill(null);

        h[0] = smaller[0];
        let left_spine = this.get_sub_tree(smaller, 1);
        this.attach_right_spine(larger, left_spine);
        this.attach_sub_tree(h, 1, larger);
        h = this.restore_arr(h);

        // console.log(left_spine, larger, h);
        return h;
    }

    restore_arr(arr) {
        // console.log("restore tree:");
        let level = Math.ceil(Math.log2(arr.length + 1));
        // console.log(arr, level);
        for (let j = level; j > 0; --j) {
            let exist = false;
            for (let iter = Math.pow(2, j-1)-1; iter < Math.pow(2, j)-1; ++iter) {
                if (arr[iter] != null) {
                    exist = true;
                    break;
                }
            }
            if (exist == false) {
                arr = arr.slice(0, Math.pow(2, j-1)-1);
            }
        }
        if (arr.length == 0) arr = [null];
        // console.log(arr);
        return arr;
    }

    get_sub_tree(arr, index) {
        if (index >= arr.length) return [null];

        let queue = [],
            result = [];
        queue.push(index);
        while (queue.length > 0) {
            let cur = queue.shift();
            result.push(arr[cur]);
            if (2 * cur + 1 < arr.length) queue.push(2 * cur + 1);
            if (2 * cur + 2 < arr.length) queue.push(2 * cur + 2);
        }
        return result;
    }

    clear_sub_tree(arr, index) {
        if (index >= arr.length) return arr;
        if (index < 0) return [];

        let queue = [];
        queue.push(index);
        while (queue.length > 0) {
            let cur = queue.shift();
            arr[cur] = null;
            if (2 * cur + 1 < arr.length) queue.push(2 * cur + 1);
            if (2 * cur + 2 < arr.length) queue.push(2 * cur + 2);
        }
        return arr;
    }

    clear_right_spine(arr) {
        if (arr.length < 3) return;

        let queue = [];
        queue.push(2);
        while (queue.length > 0) {
            let cur = queue.shift();
            arr[cur] = null;
            if (2 * cur + 1 < arr.length) queue.push(2 * cur + 1);
            if (2 * cur + 2 < arr.length) queue.push(2 * cur + 2);
        }
    }

    attach_right_spine(arr, tree) {
        // attach subtree to the right spine of the tree
        // should check whether the tree size suffice to be attached
        if (arr.length < 3) return;

        let arr_queue = [], tree_queue = [];
        arr_queue.push(2);
        tree_queue.push(0);
        while (tree_queue.length > 0) {
            let arr_cur = arr_queue.shift(),
                tree_cur = tree_queue.shift();
            arr[arr_cur] = tree[tree_cur];
            if (2 * tree_cur + 1 < tree.length) {
                tree_queue.push(2 * tree_cur + 1);
                arr_queue.push(2 * arr_cur + 1);
            }
            if (2 * tree_cur + 2 < tree.length) {
                tree_queue.push(2 * tree_cur + 2);
                arr_queue.push(2 * arr_cur + 2);
            }
        }
        return arr;
    }

    attach_sub_tree(arr, index, tree) {
        // attach subtree to the tree starting at index
        // assume the size of the array suffice the attached tree
        if (index >= arr.length) return arr;

        let arr_queue = [], tree_queue = [];
        arr_queue.push(index);
        tree_queue.push(0);
        while (tree_queue.length > 0) {
            let arr_cur = arr_queue.shift(),
                tree_cur = tree_queue.shift();
            arr[arr_cur] = tree[tree_cur];
            if (2 * tree_cur + 1 < tree.length) {
                tree_queue.push(2 * tree_cur + 1);
                arr_queue.push(2 * arr_cur + 1);
            }
            if (2 * tree_cur + 2 < tree.length) {
                tree_queue.push(2 * tree_cur + 2);
                arr_queue.push(2 * arr_cur + 2);
            }
        }
        return arr;
    }

    // assume unique key
    find_key(key) {
        for (let i = 0; i < this.arr.length; ++i) {
            for (let j = 0; j < this.arr[i].length; ++j) {
                if (this.arr[i][j] == key) {
                    return [i, j];
                }
            }
        }
        return undefined;
    }

    restore_min() {
        // restor min pointer
        let min_ind = 0;
        for (let i = 0; i < this.arr.length; ++i) {
            if (this.arr[min_ind][0] > this.arr[i][0]) min_ind = i;
        }
        if (min_ind != 0) [this.arr[0], this.arr[min_ind]] = [this.arr[min_ind], this.arr[0]];
    }

    calc_rank() {
        this.rank = [];
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
        // console.log(this.rank, this.arr);
    }
}




let rp = new RankPairingHeap();
let heap = [1,
            2, 3,
            4, 6, 7, 8,
            5, 10, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

let half = [1,
            2, null,
            4, 3, null, null,
            5, 6, 7, 8, null, null, null, null,
            null, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null];

rp.insert(half);

// should add to cy and display tree

let heap_cy = add_tree_cy(init_cy($('#cy-heap')), [heap], 'heap');
let half_cy = add_tree_cy(init_cy($('#cy-half')), rp.arr, 'half');

display_tree_cy(heap_cy, function (data) {
    return '<p class="cyval"> ' + data.val + '</p>';
});
display_tree_cy(half_cy, function (data) {
    return '<p class="cyval"> ' + data.val + '</p>';
});


let insert_cy = add_tree_cy(init_cy($('#cy-insert')), rp.arr, 'insert');
display_tree_cy(insert_cy, function (data) {
    // return '<p class="cyval"> ' + data.val + '</p>';
    return '<p class="cyrank"> Val: ' + data.val + '</p>' +
           '<p class="cyrank"> Rank: ' + data.rank + '</p>';
});


// rp.insert([11]);
// rp.insert([121]);
// rp.insert([1221]);
// rp.decrease_key(11, 10);

let decrease_cy = add_tree_cy(init_cy($('#cy-decrease')), rp.arr, 'decrease');
display_tree_cy(decrease_cy, function (data) {
    // return '<p class="cyval"> ' + data.val + '</p>';
    return '<p class="cyrank"> Val: ' + data.val + '</p>' +
           '<p class="cyrank"> Rank: ' + data.rank + '</p>';
});


let extract_cy = add_tree_cy(init_cy($('#cy-extract')), rp.arr, 'extract');
display_tree_cy(extract_cy, function (data) {
    // return '<p class="cyval"> ' + data.val + '</p>';
    return '<p class="cyrank"> Val: ' + data.val + '</p>' +
           '<p class="cyrank"> Rank: ' + data.rank + '</p>';
});




// ajax

$("#insert-form").submit(function() {
    if (!isNaN(parseInt($("#insert").val(), 10))) {
        rp.insert([parseInt($("#insert").val(), 10)]);
    }
    insert_cy = add_tree_cy(init_cy($('#cy-insert')), rp.arr, 'insert');
    display_tree_cy(insert_cy, function (data) {
        // return '<p class="cyval"> ' + data.val + '</p>';
        return '<p class="cyrank"> Val: ' + data.val + '</p>' +
               '<p class="cyrank"> Rank: ' + data.rank + '</p>';
    });
    $("#insert").val("");
    return false;
});

$("#decrease-form").submit(function() {
    if (!isNaN(parseInt($("#decrease-key").val(), 10)) && !isNaN(parseInt($("#decrease-val").val(), 10))) {
        rp.decrease_key(parseInt($("#decrease-key").val()), parseInt($("#decrease-val").val()));
    }

    decrease_cy = add_tree_cy(init_cy($('#cy-decrease')), rp.arr, 'decrease');
    display_tree_cy(decrease_cy, function (data) {
        // return '<p class="cyval"> ' + data.val + '</p>';
        return '<p class="cyrank"> Val: ' + data.val + '</p>' +
               '<p class="cyrank"> Rank: ' + data.rank + '</p>';
    });
    $("#decrease-key").val("");
    $("#decrease-val").val("");
    return false;
});

$("#extract-form").submit(function() {
    rp.extract_min();
    extract_cy = add_tree_cy(init_cy($('#cy-extract')), rp.arr, 'extract');
    display_tree_cy(extract_cy, function (data) {
        // return '<p class="cyval"> ' + data.val + '</p>';
        return '<p class="cyrank"> Val: ' + data.val + '</p>' +
               '<p class="cyrank"> Rank: ' + data.rank + '</p>';
    });
    return false;
});


//
