var treeCompare = function(){
	//global_variable
	var add_tree_mode = 2;
	var mult_tree_smaller = [];
	dataCenter.set_global_variable('mult_tree_smaller', mult_tree_smaller);
	//global_variable
	//view中全局变量
	var thisViewName = 'projection-link-view';
	//清空comparison view中的填充内容
	document.getElementById("multitree").innerHTML = '';
	var TreeCompare = {name: thisViewName};
	ObserverManager.changeListener(TreeCompare,3);
	var buttonWidth = 15;
	var _width = $("#multitree").width() - buttonWidth;
	var height = $("#rightComparisonWrapper").height() - 7;// 7是因为不会出现右边的滚动条
	var trend_height = height / 9;
	var tmp_trend_height = 0;
	var min_tree_height = height / 3.5;
	var two_level_height = height / 9;
	var leftPadding = 25;
	var transform_offset = 30;
	var tree_width = _width - leftPadding - 20;
	var bottom_padding = 5;//每个树的div下的padding
	var tree = d3.layout.tree()
		.size([tree_width,height])
		.separation(function(a, b) { 
			var dis = (a.parent == b.parent ? 1 : 2) / (a.depth * 2);
			if(a.depth <=2 && b.depth <= 2)
				dis = 3.3;
			if(a.depth==3 && b.depth==3)
				dis = 1;
	        return dis;
		 });
	var deletefrom = false;//记录是删除来源，histogram or button
	var nodes;
	var total_root = sigtree.dataProcessor().mergeTwoListAsTree([], []);//supertree根节点
	nodes = tree.nodes(total_root);
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].has = {};//索引has，记录该节点由哪些树共享，index
	}
	var id_nodes;//索引，用于根据id找到supertree中的节点node
	var cur_depth = 4;//当前所有树达到的最大深度
	var brush_nodes_list = {}; //存储brush时应放大的节点id
	//计算scale的domain的上限
	var max_flow_of_depth = [0,0,0,0,0];
	var flow_of_depth = [];
	flow_of_depth.length = 5;
	for(var i = 0; i < 5; i++){
		flow_of_depth[i] = {};
	}
	//view中全局变量
	//可能废弃的变量
	var alpabet_mark = {};//记录已占用的记号
	var datasets = dataCenter.datasets;
	var pre_datasets_id = [];//记录传来之前的信号树id，以比较传来的id，判断删除or添加
	for(var i = 0; i < datasets.length; i++){
		pre_datasets_id.push(datasets[i].id);//初始化pre_datasets_id
	}
	//添加两棵初始的树
	var dt_root = datasets[0].processor.result.treeRoot;
	var dt_root2 = datasets[1].processor.result.treeRoot;
	var add_node_list = [dt_root2,dt_root];
	var add_tree_id_list = [datasets[1].id,datasets[0].id];
	var reverse_m = false;//用来设置初始添加的两棵树的形态
	var draw_all_m = true;//用来设置初始添加的两棵树的形态
	var count = 0;//用来设置初始添加的两棵树的形态
	var c_mark = false;	
	//可能废弃的变量
	//添加树
	addMultiTree(add_node_list,add_tree_id_list);
	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([-10, 0]);
	d3.select("#"+mult_tree_smaller[0].divid+" #tree_svg g").call(tip);
	//加黑框与黑点
	add_border_of_current_signal_tree();
	//使能够拖动div
	$( "#multitree" ).sortable({
		cancel:".g_for_brush",
		axis:"y",
		//拖动结束时调用
		stop: function() {
			draw_flow_color();
			//绘制没有最下层节点时的虚线连接
			draw_dash_line();
		}
	});
    $( "#multitree" ).disableSelection();
    build_id_nodes(nodes);
    $("#default").attr("checked",true);
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
	//id_nodes，用id查找结点的位置，同步id_nodes与nodes
	//要画tree时就事先调用，保持id_nodes和nodes中的id同步
	function build_id_nodes(nodes){
		id_nodes = {};
		for(var i = 0; i < nodes.length; i++){
			id_nodes[nodes[i].id] = i;
		}		
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	function draw_depth(depth){
		if(tmp_trend_height != 0){
			trend_height = tmp_trend_height;
			tmp_trend_height = 0;
			modify_height_svg_treeHeight();
		}
		cur_depth = depth;
		expand_depth(total_root,depth);
		changeViewForSvg();
	}
	//仅在draw_depth中调用，封锁深度大于等于depth的节点，展开深度小于depth的节点
	function expand_depth(node,depth){
		if(node.depth < depth) {
			if(node._children){
				node.children = node._children;
				delete node._children;
			}
			if(node.children){
				for(var i = 0; i < node.children.length; i++){
					expand_depth(node.children[i],depth);
				}
			}
		}
		else if(node.depth == depth) {
			if(node.children){
				node._children = node.children;
				delete node.children;
				for(var i = 0; i < node._children.length; i++){
					expand_depth(node._children[i],depth);
				}
			}
		}
		else {
			if(node.children){
				node._children = node.children;
				delete node.children;
				for(var i = 0; i < node._children.length; i++){
					expand_depth(node._children[i],depth);
				}
			}
		}
	}	
	/////////////////////////////////////////////////////////////////////////////////////////////////
	//合并两棵树
	function merge_trees(root1,root2,index){
		if(root1._children){
			root1.children = root1._children;
			delete root1._children;
		}
		if(root2._children){
			root2.children = root2._children;
			delete root2._children;
		}
		var idlist = {};
		if(root1.children == undefined) root1.children = [];
		for(var j = 0; j < root1.children.length; j++){
			idlist[root1.children[j].id] = j;
		}
		for(var i = 0; i < root2.children.length; i++){
			var tmp = idlist[root2.children[i].id];
			if(tmp == undefined){
				merge_trees_putIndex(root2.children[i],index);
				root1.children.push(root2.children[i]);
			}
			else {
				root1.children[tmp].has[index] = true;
				if(root2.children[i].children == undefined && root2.children[i]._children == undefined) continue;
				merge_trees(root1.children[tmp],root2.children[i],index);
			}
		}
	}
	//仅在merge_trees中调用
	function merge_trees_putIndex(root,index){
		root.has = {};
		root.has[index] = true;
		if(root.children == undefined) return;
		for(var i = 0; i < root.children.length; i++){
			merge_trees_putIndex(root.children[i],index);
		}
	}	
	////////////////////////////////////////////////////////////////////////////////////////////////////
	/*
	* mark_reversal 是否将信号树倒置
	* 	1.计算各层节点的高度 depth_height?
	* mark_draw_all 是否绘制所有层次的信号树
	* 	1.计算各层节点的高度
	* mult_tree 选择的所有信号树，
	* 	1.遍历multi_tree数组 用来标记是否被选中
	* 	2.得到multi_tree的高度，？
	* 
	* source 信号树的root节点，根据该节点遍历得到所有的节点
	* div_i 
	 */
	function draw_tree(mark_reversal, mark_draw_all, mult_tree, source, div_i){
		var polygon_svg = d3.select("#" + mult_tree.divid + " #tree_svg");
		polygon_svg.selectAll(".node-text").remove();
		polygon_svg.selectAll(".node-polygon").remove();
		polygon_svg.selectAll(".node-count").remove();
		if(mult_tree_smaller[div_i].mark_only_flow){
			d3.select("#"+mult_tree_smaller[div_i].divid+" #tree_svg g").selectAll("*").remove();
			d3.select("#"+mult_tree_smaller[div_i].divid+" #tree_svg").style("display","none");
			return;
		}else {
			d3.select("#"+mult_tree_smaller[div_i].divid+" #tree_svg").style("display","inline");
		}
		var circle_color;
		if(mark_reversal) 
			circle_color = "#FF7F0E";
		else 
			circle_color = "steelblue";
		if(source != null){
			var mark = false;
			for(var i = 0; i < mult_tree.nodes.length; i++){
				if(mult_tree.nodes[i].id == source.id){
					mark = true;
					break;
				}
			}
			if(mark == false)
				source = null;
		}
		var tree_height = mult_tree.tree_height;
		//事先计算各层节点的高度，从0至4对应L0至L4
		var depth_height = [];
		if(mark_draw_all){
			if(mark_reversal){
				for(var i = 0; i < cur_depth + 1; i++){
					if(cur_depth == 0) {
						depth_height.push(tree_height - 20);
						break;
					}
					depth_height.push( (cur_depth - i) * (tree_height - 28) / cur_depth + 3 );
				}
			}
			else {
				for(var i = 0; i < cur_depth + 1; i++){
					if(cur_depth == 0) {
						depth_height.push(0);
						break;
					}
					depth_height.push( i * (tree_height - 28) / cur_depth + 25);
				}
			}
		}
		else{
			if(mark_reversal){
				depth_height.push(tree_height - 15)
				depth_height.push(tree_height - 20)
				depth_height.push(tree_height - 25)
				depth_height.push(tree_height - 9);
				depth_height.push(1);
				if(cur_depth == 3){
					depth_height[3] = 5;
				}
			}else{
				depth_height.push(15)
				depth_height.push(20)
				depth_height.push(25)
				depth_height.push(6);
				depth_height.push(tree_height - 4);
				if(cur_depth == 3){
					depth_height[3] = tree_height - 5;
				}
			}
		}
		var links_to_draw = tree.links(nodes).filter(function(l){
			if(mark_draw_all == false){
				if(l.source.depth != 3 || l.target.depth != 4)
					return false;
			}
			if(l.source.has[mult_tree.index] == true && l.target.has[mult_tree.index] == true){
				return true;
			}
			return false;
		});
		var diagonal = d3.svg.diagonal();
		var treeg = d3.select("#" + mult_tree.divid + " #tree_svg g");
		var links = treeg.selectAll(".link")
			.data(links_to_draw,function(l){return l.target.id;});
		links.enter()
			.insert("path")
			.attr("id",function(l){
				return "link-"+l.target.id;
			})
			.attr("class","link")
			.attr("d",function(l){
				var o;
				if(source) o = {x:source.x, y:source.y};
				else o = {x:tree_width/2,y:tree_height - 10};
				return diagonal({source:o, target:o});
			});
		links.transition()
			.duration(750)
			.attr("d",function(d){
				var sourceX = d.source.x;
				var targetX = d.target.x;
				var sourceY,targetY;
				sourceY = depth_height[d.source.depth];
				targetY = depth_height[d.target.depth];
				var s = {x:sourceX, y:sourceY};
				var t = {x:targetX, y:targetY};
				return diagonal({source:s,target:t});
			});
		links.exit()
			.transition().duration(750)
			.attr("d",function(){
				var o;
				if(source) o = {x:source.x, y:source.y};
				else o = {x:tree_width/2,y:tree_height - 10};
				return diagonal({source:o, target:o});
			})
			.remove();
		var nodes_to_draw = nodes.filter(function(d){
			if(mark_draw_all == false){
				if(d.depth < 3 && cur_depth >= 3) return false;
				if(cur_depth < 3 && d.depth != cur_depth) return false; 
			}
			if(d.has[mult_tree.index]) {
				return true;
			}
			return false;
		});
		var _nodes = treeg.selectAll(".node")
			.data(nodes_to_draw, function(d){return d.id});
		_nodes.enter()
			.append("circle")
			.attr("id", function(d) {
				return "compare-node-" + d.id;
			})
			.attr("cx",function(d){
				var o;
				if(source) o = source.x;
				else o = tree_width/2;
				return o;
			})
			.attr("cy",function(d){
				var o;
				if(source) o = source.y;
				else o = tree_height - 10;
				return o;
			})
			.style("stroke",circle_color)
			.on("mouseover", function(d, i) {
				var tmp = "M" + dataCenter.global_variable.numoftreecompare;
				var n;
				for(var i = 0; i < mult_tree.nodes.length; i++){
					if(mult_tree.nodes[i].id == d.id){
						n = mult_tree.nodes[i];
						break;
					}
				}
				//获取节点所属信号树所对应的时间
				var treeLabel = mult_tree.tree_id;
				var clickNode = {
					tree_label:treeLabel, 
					node: n 
				}
				dataCenter.set_global_variable('mouse_over_signal_node', clickNode);
				tip.html(function() {
					var tmp = n.id.split('-');
					var text = tmp[tmp.length - 1];
					if (Array.isArray(n.values)){
						text += "<br>子节点数:" +  n.values.length;
					}
					text += "<br>流量:" + d3.format(".3s")(n.flow) + 'bytes';
					return text;
				})
				if(dataCenter.global_variable.enable_tooltip){
					tip.show()
				}
				if(mult_tree.tree_id == dataCenter.global_variable.current_id)
					ObserverManager.post("mouse-over", [d.id]);
				var tmpid = d.id.replace(';','');
				d3.select("#multitree").selectAll("#compare-node-" + tmpid).classed("focus-highlight",true);
				highlight_subtree_root(d.id,mult_tree.tree_id,false);
			})
			.on("mouseout", function(d) {
				if(mult_tree.tree_id == dataCenter.global_variable.current_id)
					ObserverManager.post("mouse-out", [d.id]);
				var tmpid = d.id.replace(';','');
				d3.select("#multitree").selectAll("#compare-node-" + tmpid).classed("focus-highlight",false);	
				unhighlight_subtree_root();
				dataCenter.set_global_variable('mouse_over_signal_node', null);
				if(dataCenter.global_variable.enable_tooltip){
					tip.hide();	
				}
			})
			.on("click",function(d){
				build_id_nodes(nodes);
				var tmp = id_nodes[d.id];
				node_click_focus(nodes[tmp]);
			});
		_nodes.attr("class",function(n){
				if(n._children && mark_reversal == false) return "node node-inner";
				if(n._children && mark_reversal == true) return "node reverse-node-inner";
				return "node node-leaf";
			})
			.attr("r", function(d,i){
				var r;
				if(d.depth == 4){
					r = 1;
				}
				else if(d.depth == 3){
					r = 2.5;
				}
				else r = (4.5 - d.depth) * 2;
				if(brush_nodes_list[d.id] == true) r += 2.5;
				return r;
			})
			.style("stroke",circle_color)
			.transition()
			.duration(750)
			.attr("cx",function(d){
				return d.x;
			})
			.attr("cy",function(d){
				return depth_height[d.depth];
			});
		_nodes.exit()
			.transition().duration(750)
			.attr("cx",function(d){
				var o;
				if(source) o = source.x;
				else o = tree_width/2;
				return o;
			})
			.attr("cy",function(d){
				var o;
				if(source) o = source.y;
				else o = tree_height - 10;
				return o;
			})
			.remove();
		if(mark_draw_all == false || mult_tree_smaller[div_i].mark_only_flow) return;
		var filter_nodes = nodes.filter(function(d,i){
				if(d.count == undefined) return false;
				return d.count[div_i];
			});
		//L0，L1层上的说明
		polygon_svg.selectAll(".node-text")
			.data(nodes_to_draw)
			.enter()
			.append("text")
			.attr("class","node-text")
			.attr("x",function(d,i){
				var strArray = d.key.split(" ");
				return d.x - 6 * strArray[0].length/2 + transform_offset;
			})
			.attr("y",function(d){ return depth_height[d.depth] + 18;})
			.text(function(d,i){
				var strArray = d.key.split(" ");
				if(d.depth<2){
					return strArray[0];
				}
			})
		.attr("font-size","12px");
		//画小三角，仅在show similar part时
		polygon_svg.selectAll(".node-polygon")
			.data(filter_nodes)
			.enter()
			.append("polygon")
			.attr("class","node-polygon")
			.attr("points",function(d,i){
				var r;
				if(d.depth == 4){
					r = 1;
				}
				else if(d.depth == 3){
					r = 2.5;
				}
				else r = (4.5 - d.depth) * 2;
				var updotx = d.x + transform_offset;
				var leftx = d.x - 6 + transform_offset;
				var rightx = d.x + 6 + transform_offset;
				var updoty,lefty,righty;
				if(mark_reversal == true){
					updoty = depth_height[d.depth] + r;
					lefty = depth_height[d.depth] + r + 7;
					righty = depth_height[d.depth] + r + 7;
				}
				else {
					updoty = depth_height[d.depth] - r;
					lefty = depth_height[d.depth] - r - 7;
					righty = depth_height[d.depth] - r - 7;
				}
				return ""+updotx+","+updoty+" "+leftx+","+lefty+" "+rightx+","+righty+"";
			})
			.attr("fill","#000000");
		//小三角上的数字
		polygon_svg.selectAll(".node-count")
			.data(filter_nodes)
			.enter()
			.append("text")
			.attr("class","node-count")
			.attr("x",function(d,i){
				return d.x - 3 + transform_offset;
			})
			.attr("y",function(d){ 
				var r;
				if(d.depth == 4){
					r = 1;
				}
				else if(d.depth == 3){
					r = 2.5;
				}
				else r = (4.5 - d.depth) * 2;
				if(mark_reversal == false)
					return depth_height[d.depth] - r - 12;
				else return depth_height[d.depth] + r + 17;
			})
			.text(function(d,i){
				if(d.count && d.count[div_i]) return d.count[div_i];
			})
			.attr("font-size","20px");
		if(mark_reversal) mult_tree_smaller[div_i].depth_height = depth_height;
	}
	//点击展开模式和收缩模式
	function node_click_focus(node){
		unhighlight_subtree_root();
		if(dataCenter.global_variable.click_thisNode_shrink == false)
			node_focus(node);
		else node_click(node);
	}
	//收缩
	function node_click(node){
		if(node.children){
			node._children = node.children;
			delete node.children;
		}
		else if(node._children){
			node.children = node._children;
			delete node._children;
			if(node.depth + 1 > cur_depth){
				cur_depth = node.depth + 1;
			}
		}
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal, mult_tree_smaller[i].mark_draw_all, mult_tree_smaller[i], node, i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
		draw_flow_color();
	}
	//展开
	function node_focus(node){
		if(node == total_root) {
			draw_depth(4);
			return;
		}
		var tmpnodes = nodes;
		var d = node.depth;
		var markifexpand = [];
		markifexpand.push(node);
		while(node.parent){
			markifexpand.push(node.parent);
			node = node.parent;
		}
		expandchildren(node);
		for(var i = 0; i < tmpnodes.length; i++){
			if(tmpnodes[i].depth == 4) continue;
			if(tmpnodes[i].depth <= d){
			 	if(markifexpand.indexOf(tmpnodes[i]) == -1){
					if(tmpnodes[i].children){
						tmpnodes[i]._children = tmpnodes[i].children;
						delete tmpnodes[i].children;
					}
				}
				else {
					if(tmpnodes[i]._children){
						tmpnodes[i].children = tmpnodes[i]._children;
						delete tmpnodes[i]._children;
					}
				}
			}
		}
		cur_depth = 4;
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal,mult_tree_smaller[i].mark_draw_all,mult_tree_smaller[i],node,i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
		draw_flow_color();
	}
	//仅在node_focus中调用
	function expandchildren(node){
		if(node.depth == 4) return;
		if(!node._children && !node.children) return;
		if(node._children){
			node.children = node._children;
			delete node._children;
		}
		for(var i = 0; i < node.children.length; i++){
			expandchildren(node.children[i]);
		}
	}	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	// draw trend
	// 流量图
	function draw_trend(mark_reversal, div_i){
		var rect_color;
		var scale = d3.scale.sqrt();
		if(mark_reversal) rect_color = "#FF7F0E";
		else rect_color = "steelblue";
		var leaves = mult_tree_smaller[div_i].nodes.filter(function(n){
			if(id_nodes[n.id] == undefined) return false;
			return n.depth == cur_depth;
		});
		var trendg;
		if(mark_reversal) {
			d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_top_svg").style("display","inline");
			$("#" + mult_tree_smaller[div_i].divid + " #flow_top_svg").height(trend_height);
			$("#" + mult_tree_smaller[div_i].divid + " #flow_top_svg").width(tree_width + transform_offset + 10);
			trendg = d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_top_svg g");
			d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_bottom_svg g")
				.selectAll("g").remove();
			d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_bottom_svg").style("display","none");
		}else{
			d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_bottom_svg").style("display","inline");
			$("#" + mult_tree_smaller[div_i].divid + " #flow_bottom_svg").height(trend_height);
			$("#" + mult_tree_smaller[div_i].divid + " #flow_bottom_svg").width(tree_width + transform_offset + 10);
			trendg = d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_bottom_svg g");
			d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_top_svg g")
				.selectAll("g").remove();
			d3.select("#" + mult_tree_smaller[div_i].divid + " #flow_top_svg").style("display","none");
		}
		scale.domain([0,1.3 * Math.sqrt(max_flow_of_depth[cur_depth])])
			.range([0,trend_height]);
		var bars = trendg.selectAll(".bar")
			.data(leaves,function(d){return d.id;});
		var bars_enter = bars.enter().insert("g").attr("class","bar")
			.attr("fill",rect_color)
			.attr("transform",function(leaf){
					return "translate("+($("#multitree").width() - leftPadding)/2+")";
				})
			.append("rect")
			.attr("id",function(d){
				return "flow-rect-" + d.id;
			});
		if(mark_reversal == false){
			bars.selectAll("rect").attr("width",2)
				.attr("height",function(leaf){
					if(leaf.flow < 1) return 0;
					return scale(Math.sqrt(leaf.flow));
				});
		}
		else{
			bars.selectAll("rect").attr("width",2)
				.attr("height",function(leaf){
					if(leaf.flow < 1) return 0;
					return scale(Math.sqrt(leaf.flow));
				}).attr("transform",function(leaf){
					if(leaf.flow < 1) return "translate(0)";
					var t = trend_height - scale(Math.sqrt(leaf.flow));
					return "translate(0," + t + ")";
				});
		}
		bars.transition().duration(750).attr("transform", function(leaf){
			var x = nodes[id_nodes[leaf.id]].x;
			return "translate(" + x + ")";
		});
		bars.exit().remove();
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////////
	//画虚线
	function draw_dash_line(){
		d3.selectAll(".dash_line").remove();
		if(mult_tree_smaller.length < 2) return;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if($("#"+mult_tree_smaller[i].divid).parent().prev().length == 0) continue;
			if(mult_tree_smaller[i].mark_reversal && mult_tree_smaller[i].mark_draw_all && !mult_tree_smaller[i].mark_only_flow){
				var tmp2 = $("#"+mult_tree_smaller[i].divid).parent().prev().children();
				var num = tmp2.attr("id").slice(7);
				var i2 = parseInt(d3.select("#delete"+num).attr("value"));
				if(!mult_tree_smaller[i2].mark_reversal && mult_tree_smaller[i2].mark_draw_all && !mult_tree_smaller[i2].mark_only_flow){
					var coordinate = [];
 					var index1 = mult_tree_smaller[i].index;
					var index2 = mult_tree_smaller[i2].index;
 					for(var j = 0; j < nodes.length; j++){
						if(nodes[j].depth >= cur_depth) continue;
						if(nodes[j].has[index1] && nodes[j].has[index2] && !nodes[j].children){
							var x = nodes[j].x;
							var y = mult_tree_smaller[i].depth_height[nodes[j].depth];
							coordinate.push({x:x, y:y});
						}
					}
					if(coordinate.length > 0) draw_line(coordinate,i,i2);
				}
			}
		}
	}
	//画线，仅在draw_dash_line中调用
	function draw_line(coordinate,m_i,m_i2){
		var line = d3.svg.line()
			.x(function(d){return d.x;})
			.y(function(d){return d.y;});
		for(var i = 0; i < coordinate.length; i++){
			var tree2_d1 = {x:coordinate[i].x, y:coordinate[i].y};
			var tree2_d2 = {x:coordinate[i].x, y:0};
			var trend_d1 = {x:coordinate[i].x, y:0};
			var trend_d2 = {x:coordinate[i].x, y:trend_height};
			var tree1_d1 = {x:coordinate[i].x, y:mult_tree_smaller[m_i].tree_height - coordinate[i].y};
			var tree1_d2 = {x:coordinate[i].x, y:mult_tree_smaller[m_i].tree_height};
			d3.select("#"+mult_tree_smaller[m_i].divid+" #tree_svg g")
				.append("path")
				.attr("stroke-dasharray","2,2")
				.attr("class","dash_line")
				.attr("d",line([tree2_d1,tree2_d2]));
			d3.select("#"+mult_tree_smaller[m_i2].divid+" #tree_svg g")
				.append("path")
				.attr("stroke-dasharray","2,2")
				.attr("class","dash_line")
				.attr("d",line([tree1_d1,tree1_d2]));
			d3.select("#"+mult_tree_smaller[m_i].divid+" #flow_top_svg g")
				.append("path")
				.attr("stroke-dasharray","2,2")
				.attr("class","dash_line")
				.attr("d",line([trend_d1,trend_d2]));
			d3.select("#"+mult_tree_smaller[m_i2].divid+" #flow_bottom_svg g")
				.append("path")
				.attr("stroke-dasharray","2,2")
				.attr("class","dash_line")
				.attr("d",line([trend_d1,trend_d2]));
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//给能对应上的流量柱赋予颜色
	function draw_flow_color(){
		d3.selectAll("#multitree rect").classed("flow_similar_rect",false);
		if(mult_tree_smaller.length < 2) return;
		var first_one = parseInt(d3.select("#multitree li div div span").attr("value"));
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if($("#"+mult_tree_smaller[i].divid).parent().prev().length == 0) continue;
			if(i == first_one) continue;
			var tmp2 = $("#"+mult_tree_smaller[i].divid).parent().prev().children();
			var num = tmp2.attr("id").slice(7);
			var i2 = parseInt(d3.select("#delete"+num).attr("value"));
			if(mult_tree_smaller[i].mark_reversal && !mult_tree_smaller[i2].mark_reversal){
				var index1 = mult_tree_smaller[i].index;
				var index2 = mult_tree_smaller[i2].index;
				for(var j = 0; j < nodes.length; j++){
					if(nodes[j].depth != cur_depth) continue;
					if(nodes[j].has[index1] && nodes[j].has[index2]){
						d3.select("#"+mult_tree_smaller[i].divid+" #flow-rect-"+nodes[j].id)
							.classed("flow_similar_rect",true);
						d3.select("#"+mult_tree_smaller[i2].divid+" #flow-rect-"+nodes[j].id)
							.classed("flow_similar_rect",true);
					}
				}
			}
		}
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	//显示相似部分
	function completelyShowSimilarPart(){
		if(mult_tree_smaller.length < 2) return;
		var index;
		var tree_id = dataCenter.global_variable.current_id;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if(mult_tree_smaller[i].tree_id == tree_id){
				index = mult_tree_smaller[i].index;
				break;
			}
		}
		var markifexpand = [];	
		var similar_nodes_id = [];
		for(var i = 0; i < nodes.length; i++){
			if(nodes[i].children){
				nodes[i]._children = nodes[i].children;
				delete nodes[i].children;
			}
			var count_mark = false;
			for(key in nodes[i].has){
				if(parseInt(key) != index){
					count_mark = true;
					break;
				}
			}
			if(nodes[i].has[index] && count_mark){
				markifexpand.push(nodes[i]);
				similar_nodes_id.push(nodes[i].id);
			}
		}
		dataCenter.set_global_variable("similar_id_array",similar_nodes_id);
		cur_depth = 0;
		for(var i = 0; i < markifexpand.length; i++){
			if(markifexpand[i].depth > cur_depth) cur_depth = markifexpand[i].depth;
			var node = markifexpand[i];
			while(node.parent){
				if(node.parent._children){
					node.parent.children = [];
					var all_num_of_nodes = [];
					var drawn_num_of_nodes = [];
					for(var j = 0; j < mult_tree_smaller.length; j++){
						all_num_of_nodes[j] = 0;
						drawn_num_of_nodes[j] = 0;
					}
					for(var j = 0; j < node.parent._children.length; j++){
						var tmp = node.parent._children[j];
						for(var z = 0; z < mult_tree_smaller.length; z++){
							var tmpz = mult_tree_smaller[z].index;
							if(tmp.has[tmpz]) all_num_of_nodes[z]++;
						}
						if(markifexpand.indexOf(tmp) != -1){
							node.parent.children.push(tmp);
							for(var z = 0; z < mult_tree_smaller.length; z++){
								var tmpz = mult_tree_smaller[z].index;
								if(tmp.has[tmpz]) drawn_num_of_nodes[z]++;
							}
						}
					}
					for(var j = 0; j < mult_tree_smaller.length; j++){
						all_num_of_nodes[j] = all_num_of_nodes[j] - drawn_num_of_nodes[j];
					}
					node.parent.count = all_num_of_nodes.slice(0);
					node.parent.originalChildren = node.parent._children;
					delete node.parent._children;
				}
				else break;
				node = node.parent;
			}
		}
		changeViewForSvg();
		for(var i = 0; i < nodes.length; i++){
			if(nodes[i].originalChildren){
				nodes[i].children = nodes[i].originalChildren;
				delete nodes[i].originalChildren;
				if(nodes[i].count) delete nodes[i].count;
			}
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////
	//highlight 节点的子树及到根节点的路径
	var highlight_id_list,has;
	function highlight_subtree_root(node_id,tree_id,mark_from_Global){
		highlight_id_list = [];
		var node = nodes[id_nodes[node_id]];
		var node1 = node;
		if(node == undefined) return;
		while(node.parent != undefined){
			var tmpid = node.parent.id.replace(';','');
				highlight_id_list.push(tmpid);
			node = node.parent;
		}
		node = node1;
		var tmp_index;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if(mult_tree_smaller[i].tree_id == tree_id){
				tmp_index = mult_tree_smaller[i].index;
				break;
			}
		}
		put_subtree_node_id(node,highlight_id_list,tmp_index);
		has = node1.has;
		for(key in node1.has){
			key = parseInt(key);
			if(mark_from_Global){
				if(tmp_index != key) continue;
			}
			var i;
			for(i = 0; i < mult_tree_smaller.length; i++){
				if(key == mult_tree_smaller[i].index) break;
			}
			var g = d3.select("#"+mult_tree_smaller[i].divid+" #tree_svg g");
			for(var j = 0; j < highlight_id_list.length; j++){
				var tmp1_id = highlight_id_list[j].replace(';','');
				g.select("#compare-node-"+tmp1_id).attr("class","routenode-inner");
				g.select("#link-"+tmp1_id).attr("class","route-link");
			}
			var tmp_id = node.id.replace(';','');
			g.select("#link-"+tmp_id).attr("class","route-link");
		}
		highlight_id_list.push(node.id);
	}
	//仅在highlight_subtree_root中调用
	function put_subtree_node_id(node,list,index){
		if(node.children == undefined) return;
		for(var i = 0; i < node.children.length; i++){
			if(node.children[i].has[index]){
				var tmpid = node.children[i].id.replace(';','');
				list.push(node.children[i].id);
			}
			put_subtree_node_id(node.children[i],list,index);
		}
	}	
	/////////////////////////////////////////////////////////////////////////////////////////////////////
	//取消highlight
	function unhighlight_subtree_root(){
		for(key in has){
			key = parseInt(key);
			var i;
			for(i = 0; i < mult_tree_smaller.length; i++){
				if(key == mult_tree_smaller[i].index) break;
			}
			var g = d3.select("#"+mult_tree_smaller[i].divid+" #tree_svg g");
			for(var j = 0; j < highlight_id_list.length; j++){
				var tmp_id = highlight_id_list[j].replace(';','');
				g.select("#compare-node-"+tmp_id).attr("class",function(d){
					if(mult_tree_smaller[i].mark_reversal){
						if(d._children) return "node reverse-node-inner";
						else return "node node-leaf";
					}
					else{
						if(d._children) return "node node-inner";
						else return "node node-leaf";
					}
				});
				g.select("#link-"+tmp_id).attr("class","link");
			}
		}
		highlight_id_list = [];
		has = {};
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////
	//根据树id如"20120121-R07-75"，删除树
	function delete_tree(tree_id){
		var index;
		var d;
		var alpabet_index;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if(mult_tree_smaller[i].tree_id == tree_id) {
				d = i;
				alpabet_index = mult_tree_smaller[i].alpabet_index;
				delete alpabet_mark[alpabet_index];
				index = mult_tree_smaller[i].index;
				break;
			}
		}
		delete total_root.has[index];
		delete_index_fromroot(total_root,index);
		if(deletefrom){
			for(var i = d + 1; i < mult_tree_smaller.length; i++){
				d3.select("#" + mult_tree_smaller[i].buttondiv).selectAll("span").attr("value",i - 1);
			}
		}
		$("#" + mult_tree_smaller[d].divid).parent().remove();
		max_flow_of_depth = [0,0,0,0,0];
		update_scale_domain_when_delete(mult_tree_smaller[d].nodes);
		mult_tree_smaller.splice(d,1);
		modify_height_svg_treeHeight();
		changeViewForSvg();
	}
	//仅在delete_tree中调用，用以删除每个节点的has数组中某棵树的标记，若has长度删除前为1则删除该节点及其子树
	function delete_index_fromroot(root,index){
		if(root.children == undefined) return;
		var deletemark = [];
		for(var i = 0; i < root.children.length; i++){
			var tmp = root.children[i];
			var tmpindex = tmp.has[index];
			if(tmpindex == undefined)
				continue;
			else{
				var l = 0;
				for(key in tmp.has)
					l++;
				if(l == 1){
					deletemark.push(i);
					continue;
				}
				else{
					delete tmp.has[index];
					delete_index_fromroot(tmp,index);
				}
			}
		}
		for(var i = deletemark.length - 1; i >= 0; i--){
			root.children.splice(deletemark[i],1);
		}
	}	
	//删除树时用于更新flow_of_depth, max_flow_of_depth
	function update_scale_domain_when_delete(nodes){
		for(var i = 0; i < nodes.length; i++){
			flow_of_depth[nodes[i].depth][parseInt(nodes[i].flow)]--;
			if(flow_of_depth[nodes[i].depth][parseInt(nodes[i].flow)] == 0)
				delete flow_of_depth[nodes[i].depth][parseInt(nodes[i].flow)];
		}
		for(var i = 0; i < 5; i++){
			for(key in flow_of_depth[i]){
				key = parseInt(key);
				if(key > max_flow_of_depth[i] && flow_of_depth[i][key] > 0)
					max_flow_of_depth[i] = key;
			}
		}
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	//增加多棵树
	function addMultiTree(nodes,idlist){
		for(var i = 0; i < nodes.length; i++){
			//设置初始两棵树的形态，及之后添加一棵树的形态变化
			var mark_only_flow = false;
			if(count == 0){
				reverse_m = false;
				draw_all_m = true;
				count = 1;
			}
			else if(count == 1){
				reverse_m = true;
				draw_all_m = true;
				count = 2;
			}
			else if(count == 2){
				reverse_m = false;
				draw_all_m = false;
				if(mult_tree_smaller.length > 0 && add_tree_mode == 2){
					mult_tree_smaller[0].mark_draw_all = false;
					mult_tree_smaller[0].tree_height = two_level_height;
				}	
				if(mult_tree_smaller.length > 1 && add_tree_mode == 2){
					mult_tree_smaller[1].mark_draw_all = false;
					mult_tree_smaller[1].tree_height = two_level_height;
				}
				c_mark = true;
				count = 3;
				if(add_tree_mode == 0 || add_tree_mode == 1)
					mark_only_flow = true;
			}
			else{
				reverse_m = false;
				if(add_tree_mode == 0 || add_tree_mode == 1)
					mark_only_flow = true;
				else if(add_tree_mode == 2){
					draw_all_m = false;
					mark_only_flow = false;
				}
				else{
					draw_all_m = true;
					mark_only_flow = false;
				}
			}
			var node = nodes[i];
			var tree_height = addclick();
			var nodes1 = tree.nodes(node);
			//计算所有节点每层的流量最大值
			for(var j = 0; j < nodes1.length; j++){
				var tmp = flow_of_depth[nodes1[j].depth][parseInt(nodes1[j].flow)];
				if(tmp == undefined) flow_of_depth[nodes1[j].depth][parseInt(nodes1[j].flow)] = 1;
				else flow_of_depth[nodes1[j].depth][parseInt(nodes1[j].flow)]++;
				if(parseInt(nodes1[j].flow) > max_flow_of_depth[nodes1[j].depth]){
					max_flow_of_depth[nodes1[j].depth] = parseInt(nodes1[j].flow);
				}
			}
			var alpabet_index;
			//设置上限20000棵树
			for(var j = 0; j < 20000; j++){
				if(!alpabet_mark[j]){
					alpabet_index = j;
					alpabet_mark[j] = true;
					break;
				}
			}
			mult_tree_smaller.push({
				nodes:nodes1, //由tree.nodes()得到
				node:node, //树的根节点
				tree_id:idlist[i], //如"20120121-R07-75"
				index:dataCenter.global_variable.numoftreecompare+2, //index放在每个叶节点的has数组中标记当前节点有哪些树共用
				divid:"treemap"+dataCenter.global_variable.numoftreecompare,//包裹树的div的id
				buttondiv:"treemap_label_div" + dataCenter.global_variable.numoftreecompare,//左上角操作栏的div的id
				alpabet_index:alpabet_index,//位于左上角，树的序号，与histogram中的序号对应
				mark_reversal:reverse_m,//是否翻转
				mark_draw_all:draw_all_m,//画全部，或末两层
				mark_only_flow:mark_only_flow,//仅画流量
				tree_height:tree_height//树的高度
			});
			total_root.has[dataCenter.global_variable.numoftreecompare + 2] = true;
			merge_trees(total_root,node,dataCenter.global_variable.numoftreecompare + 2);
			var k = dataCenter.global_variable.numoftreecompare + 1;
			dataCenter.set_global_variable("numoftreecompare",k);
		}
		if(c_mark == true){
			c_mark = false;
			modify_height_svg_treeHeight();
		}		
		if(add_tree_mode == 0){
			shortest_height_only_show_flow();
			modify_buttondiv_label_style();
		}
		else{
			modify_buttondiv_label_style();
			if(cur_depth != 4) draw_depth(cur_depth);
			else changeViewForSvg();
		}
	}
	//改变各div的高度，增加div，返回g
	function addclick(){
		var sum_height = 0,sum_min_tree_height = 0,sum_other_height = 0;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if(mult_tree_smaller[i].mark_draw_all == false && !mult_tree_smaller[i].mark_only_flow){
				sum_height += trend_height + two_level_height;
				sum_other_height += trend_height + two_level_height;
			}
			else if(!mult_tree_smaller[i].mark_only_flow){
				sum_height += trend_height + min_tree_height;
				sum_min_tree_height += min_tree_height;
				sum_other_height += trend_height;
			}
			else{
				sum_height += trend_height;
				sum_other_height += trend_height;
			}
		}
		var tmp_tree_height;
		var customize_height;
		if(count<3) customize_height = min_tree_height;
		else{
			if( add_tree_mode == 2)
				customize_height = two_level_height;
			else if(add_tree_mode == 0 || add_tree_mode == 1)
				customize_height = 0;
			else customize_height = min_tree_height;
		}
		if(sum_height + trend_height + customize_height <= height){
			sum_height += trend_height + customize_height;
			if(count < 3){
				sum_other_height += trend_height;
				sum_min_tree_height += min_tree_height;
			}
			else if(add_tree_mode == 0 || add_tree_mode == 1){
				sum_other_height += trend_height;
			}
			else if(add_tree_mode == 2){
				sum_other_height += two_level_height + trend_height;
			}
			else{
				sum_other_height += trend_height;
				sum_min_tree_height += min_tree_height;
			}
			var k = (height - (mult_tree_smaller.length+1) * bottom_padding - sum_other_height) / sum_min_tree_height;
			var tree_height = k * min_tree_height;
			for(var j = 0; j < mult_tree_smaller.length; j++){
				if(mult_tree_smaller[j].mark_draw_all && !mult_tree_smaller[j].mark_only_flow){
					mult_tree_smaller[j].tree_height = k * min_tree_height;
					tree_height = mult_tree_smaller[j].tree_height;
					d3.select("#"+mult_tree_smaller[j].divid+" #tree_svg").attr("height",tree_height);
					$("#"+mult_tree_smaller[j].divid).height(tree_height+trend_height+bottom_padding);
				}
			}
			var global_numoftreecompare = dataCenter.global_variable.numoftreecompare;
			d3.select("#multitree").append("li")
				.append("div").attr("id",function(){
					return "treemap" + global_numoftreecompare;
				}).style("position","relative");
			if(customize_height == min_tree_height) customize_height = tree_height;
			if(count == 3) tree_height = customize_height;
			if(tree_height == 0) tree_height = two_level_height;
			$("#treemap"+global_numoftreecompare).height(customize_height+trend_height+bottom_padding);
			d3.select("#treemap"+global_numoftreecompare).append("svg").attr("id","flow_top_svg")
				.attr("height",trend_height)
				.attr("value",global_numoftreecompare)
				.on("dblclick",double_click_draw_all_or_part_tree)
				.on("click",hide_button_span)
				.on("mouseenter",update_brush_g)
				.append("g").attr("transform","translate("+transform_offset+",0)")
				.attr("class","g_for_brush");
			d3.select("#treemap" + global_numoftreecompare).append("svg").attr("id","tree_svg")
				.attr("width",tree_width + transform_offset + 10)
				.attr("height",tree_height)
				.attr("value",global_numoftreecompare)
				.on("click",hide_button_span)
				.on("dblclick",double_click_draw_all_or_part_tree)
				.append("g").attr("transform","translate("+transform_offset+",0)");
			d3.select("#treemap"+global_numoftreecompare).append("svg").attr("id","flow_bottom_svg")
				.attr("height",trend_height)
				.attr("value",global_numoftreecompare)
				.on("click",hide_button_span)
				.on("dblclick",double_click_draw_all_or_part_tree)
				.on("mouseenter",update_brush_g)
				.append("g").attr("transform","translate("+transform_offset+",0)")
				.attr("class","g_for_brush");
			tmp_tree_height = tree_height;
		}
		else{
			var tree_height = customize_height;
			if(customize_height == 0) tree_height = two_level_height;
			var global_numoftreecompare = dataCenter.global_variable.numoftreecompare;
			for(var i = 0; i < mult_tree_smaller.length; i++){
				if(mult_tree_smaller[i].mark_draw_all && !mult_tree_smaller[i].mark_only_flow){
					mult_tree_smaller[i].tree_height = min_tree_height;
					d3.select("#"+mult_tree_smaller[i].divid+" #tree_svg").attr("height",min_tree_height);
					$("#"+mult_tree_smaller[i].divid).height(min_tree_height+trend_height+bottom_padding);
				}
			}
			d3.select("#multitree").append("li")
				.append("div").attr("id",function(){
					return "treemap" + global_numoftreecompare;
				}).style("position","relative");
			$("#treemap"+global_numoftreecompare).height(customize_height+trend_height+bottom_padding);
			d3.select("#treemap"+global_numoftreecompare).append("svg").attr("id","flow_top_svg")
				.attr("value",global_numoftreecompare)
				.attr("height",trend_height)
				.on("click",hide_button_span)
				.on("dblclick",double_click_draw_all_or_part_tree)
				.on("mouseenter",update_brush_g)
				.append("g").attr("transform","translate("+transform_offset+",0)")
				.attr("class","g_for_brush");
			d3.select("#treemap" + global_numoftreecompare).append("svg").attr("id","tree_svg")
				.attr("width",tree_width + transform_offset + 10)
				.attr("height",tree_height)
				.attr("value",global_numoftreecompare)
				.on("click",hide_button_span)
				.on("dblclick",double_click_draw_all_or_part_tree)
				.append("g").attr("transform","translate("+transform_offset+",0)");
			d3.select("#treemap"+global_numoftreecompare).append("svg").attr("id","flow_bottom_svg")
				.attr("value",global_numoftreecompare)
				.attr("height",trend_height)
				.on("click",hide_button_span)
				.on("dblclick",double_click_draw_all_or_part_tree)
				.on("mouseenter",update_brush_g)
				.append("g").attr("transform","translate("+transform_offset+",0)")
				.attr("class","g_for_brush");
			tmp_tree_height = tree_height;
		}
		var global_numoftreecompare = dataCenter.global_variable.numoftreecompare;
		var tmpdiv = d3.select("#treemap" + global_numoftreecompare).append("div").attr("id","treemap_label_div" + global_numoftreecompare)
			.style("position","absolute")
			.style("top",0)
			.style("left",0);
		$("#treemap_label_div" + global_numoftreecompare).width(50);
		tmpdiv.append("svg").style("position","absolute")
			.style("top",0)
			.attr("height",20)
			.attr("width",40)
			.append("circle")
			.attr("class","select_circle")
			.attr("id","selected_circle")
			.attr("cx",36)
			.attr("cy",9)
			.attr("r",3.5)
			.attr("fill","#000000")
			.attr("visibility","hidden");
		tmpdiv.append("span").attr("id","label_alpabet" +global_numoftreecompare)
			.style("position","absolute")
			.style("top",0)
			.attr("value",mult_tree_smaller.length)
			.on("click",label_click);
		tmpdiv.append("br");
		tmpdiv.append("span").attr("id","delete" + global_numoftreecompare).style("display","none")
			.attr("class","btn btn-default btn-xs active level-btn toolbar-tree")
			.html("<span class=\"glyphicon glyphicon-remove\"></span>")
			.attr("value",mult_tree_smaller.length)
			.on("click",delete_button_click);
		tmpdiv.append("br");
		tmpdiv.append("span").attr("id","reverse" + global_numoftreecompare).style("display","none")
			.attr("class","btn btn-default btn-xs active level-btn toolbar-tree")
			.html("<span class=\"glyphicon glyphicon-sort\"></span>")
			.attr("value",mult_tree_smaller.length)
			.on("click",reverse_tree_click);
		tmpdiv.append("br");
		tmpdiv.append("span").attr("id","set_current_id" + global_numoftreecompare).style("display","none")
			.attr("class","btn btn-default btn-xs active level-btn toolbar-tree")
			.html("<span class=\"glyphicon glyphicon-record\"></span>")
			.attr("value",mult_tree_smaller.length)
			.on("click",set_current_id_click);
		return tmp_tree_height;
	}
	//删除按钮操作
	function delete_button_click(){
		var value = parseInt(d3.select(this).attr("value"));
		//比当前按钮属性value大的value全部减1
		for(var i = value + 1; i < mult_tree_smaller.length; i++){
			d3.select("#" + mult_tree_smaller[i].buttondiv).selectAll("span").attr("value",i - 1);
		}
		var tmp = mult_tree_smaller[value].tree_id;
		//改变之前记录的信号树的id数组
		if(pre_datasets_id.indexOf(tmp) != -1){
			pre_datasets_id.splice(pre_datasets_id.indexOf(tmp),1);
		}
		var tmp_idlist = pre_datasets_id.slice(0);
		dataCenter.set_global_variable("selection_array",tmp_idlist);
		deletefrom = false;
		delete_tree(tmp);
		if(dataCenter.global_variable.current_id == tmp){ 
			if(mult_tree_smaller.length >= 1){
				dataCenter.set_global_variable("current_id",mult_tree_smaller[mult_tree_smaller.length - 1].tree_id);
			}
			else dataCenter.set_global_variable("current_id",null);
			add_border_of_current_signal_tree();
		}
	}

	var brush_compare = d3.svg.brush();
	//用来brush
	var xscale = d3.scale.identity()
		.domain([0,$("#multitree").width()]);
	brush_compare.x(xscale)
		.on("brushend",brushedcompare);
	//更新brush的区域
	function update_brush_g(){
		if(mult_tree_smaller.length == 0) return;
		brush_compare.clear();
		var val = d3.select(this).attr("value");
		var id = d3.select(this).attr("id");
		var value = parseInt(d3.select("#delete"+val).attr("value"));
		//删去brush的g
		d3.selectAll(".created_g_for_brush").remove();
		//添加新的g for brush
		d3.select("#"+mult_tree_smaller[value].divid+" #"+id+" g").append("g")
			.attr("class","created_g_for_brush")
			.attr("stroke","#fff")
			.attr("fill-opacity",0.125)
			.call(brush_compare)
			.selectAll("rect")
			.attr("y",0)
			.attr("height",trend_height);
	}
	//流量图的brush操作
	function brushedcompare(){
		var extentX = +d3.select(".extent").attr("x");
		var extentWidth = +d3.select(".extent").attr("width");
		var nodel = nodes.filter(function(n){
			if(n.depth != cur_depth) return false;
			if(n.x < extentX || n.x > extentX + extentWidth) return false;
			return true;
		});
		if(nodel.length < 1) {
			brush_compare.clear();
			changeViewForSvg();
		}
		else nodes_lenses(nodel);
	}
	//仅在brushedcompare中调用
	function nodes_lenses(nodelist){
		brush_nodes_list = {};
		for(var i = 0; i < nodelist.length; i++){
			var tmp = nodelist[i];
			brush_nodes_list[tmp.id] = true;
			if(tmp.parent == undefined) continue;
			while(brush_nodes_list[tmp.parent.id] == undefined || brush_nodes_list[tmp.parent.id] == false){
				brush_nodes_list[tmp.parent.id] = true;
				tmp = tmp.parent;
				if(tmp.parent == undefined) break;
			}
		}
		tree.separation(function(a, b) { 
			var dis = (a.parent == b.parent ? 1 : 2) / (a.depth * 3);
			if(a.depth <=2 && b.depth <= 2)
				dis = 3.3 / 3;
			if(a.depth==3 && b.depth==3)
				dis = 1 / 3;
			if(brush_nodes_list[a.id] == true || brush_nodes_list[b.id] == true)
				dis *= 3;
            return dis;
		 });
		changeViewForSvg();
		brush_nodes_list = {};
		tree.separation(function(a, b) { 
			var dis = (a.parent == b.parent ? 1 : 2) / (a.depth * 2);
			if(a.depth <=2 && b.depth <= 2)
				dis = 3.3;
			if(a.depth==3 && b.depth==3)
				dis = 1;
	        return dis;
		 });
		//隐藏矩形框
		d3.select("#multitree").selectAll(".extent").attr("width",1).attr("x",1);
	}
	//单击左上角的数字框
	function label_click(){
		var tmp = parseInt(d3.select(this).attr("value"));
		var tmp_num = mult_tree_smaller[tmp].buttondiv.slice(17);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			var j = mult_tree_smaller[i].buttondiv.slice(17);
			if(i == tmp) continue;
			if(d3.select("#delete"+j).style("display") == "inline"){
				d3.select("#delete"+j).style("display","none");
				d3.select("#reverse"+j).style("display","none");
				d3.select("#set_current_id"+j).style("display","none");
				d3.select("#" + mult_tree_smaller[i].buttondiv).style("z-index",0);
			}
		}
		if(d3.select("#delete"+tmp_num).style("display") == "none"){
			d3.select("#delete"+tmp_num).style("display","inline");
			d3.select("#reverse"+tmp_num).style("display","inline");
			d3.select("#set_current_id"+tmp_num).style("display","inline");
			d3.select("#" + mult_tree_smaller[tmp].buttondiv).style("z-index",9999);
		}
		else {
			d3.select("#delete"+tmp_num).style("display","none");
			d3.select("#reverse"+tmp_num).style("display","none");
			d3.select("#set_current_id"+tmp_num).style("display","none");
			d3.select("#" + mult_tree_smaller[tmp].buttondiv).style("z-index",0);
		}
	}
	//设置current_id
	function set_current_id_click(){
		var value = parseInt(d3.select(this).attr("value"));
		dataCenter.set_global_variable("current_id",mult_tree_smaller[value].tree_id);
		add_border_of_current_signal_tree();
	}
	//隐藏左上角操作栏
	function hide_button_span(){
		for(var i = 0; i < mult_tree_smaller.length; i++){
			var j = mult_tree_smaller[i].buttondiv.slice(17);
			if(d3.select("#delete"+j).style("display") == "inline"){
				d3.select("#delete"+j).style("display","none");
				d3.select("#reverse"+j).style("display","none");
				d3.select("#set_current_id"+j).style("display","none");
			}
			d3.select("#"+mult_tree_smaller[i].buttondiv).style("z-index",0);
		}
	}
	//双击,在只显示流量，最后两层，全部展开中切换
	function double_click_draw_all_or_part_tree(){
		var n = d3.select(this).attr("value");
		n = parseInt(n);
		var value = d3.select("#delete"+n).attr("value");
		value = parseInt(value);
		draw_all_or_part_tree(value);
	}	
	//在只显示流量，最后两层，全部展开中切换,仅在double_click_draw_all_or_part_tree中调用
	function draw_all_or_part_tree(value){
		var tmp_tree = mult_tree_smaller[value];
		if(tmp_tree.mark_only_flow){
			tmp_tree.mark_only_flow = false;
			tmp_tree.mark_draw_all = false;
		}
		else if(tmp_tree.mark_draw_all == true){
			tmp_tree.mark_only_flow = true;
		}
		else tmp_tree.mark_draw_all = true;
		modify_height_svg_treeHeight();
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal,mult_tree_smaller[i].mark_draw_all,mult_tree_smaller[i],null,i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
	}		
	//翻转树
	function reverse_tree_click(){
		var value = parseInt(d3.select(this).attr("value"));
		var tmp_tree = mult_tree_smaller[value];
		tmp_tree.mark_reversal = (tmp_tree.mark_reversal == false);
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		draw_tree(tmp_tree.mark_reversal,tmp_tree.mark_draw_all,mult_tree_smaller[value],null,value);
		draw_trend(tmp_tree.mark_reversal,value);
		draw_dash_line();
		modify_buttondiv_label_style();
		draw_flow_color();
	}
	//根据树的翻转，调整对应操作栏的颜色
	function modify_buttondiv_label_style(){
		if(mult_tree_smaller.length == 0) return;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if(mult_tree_smaller[i].mark_reversal)
				d3.select("#label_alpabet" + mult_tree_smaller[i].buttondiv.slice(17))
					.html("<span class=\"btn btn-default btn-xs span-label\" style=\'background-color: #FF7F0E\'>"
						+mult_tree_smaller[i].alpabet_index+"</span>");
			else
				d3.select("#label_alpabet" + mult_tree_smaller[i].buttondiv.slice(17))
					.html("<span class=\"btn btn-default btn-xs span-label\" style=\'background-color: steelblue\'>"
						+mult_tree_smaller[i].alpabet_index+"</span>");
		}
	}	
////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//更改每棵树的div以及其中svg的高度
	function modify_height_svg_treeHeight(){
		var sum_height = 0,sum_min_tree_height = 0,sum_other_height = 0;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			if(mult_tree_smaller[i].mark_draw_all == false && !mult_tree_smaller[i].mark_only_flow){
				sum_height += trend_height + two_level_height;
				sum_other_height += trend_height + two_level_height;
			}
			else if(mult_tree_smaller[i].mark_draw_all == true && !mult_tree_smaller[i].mark_only_flow){
				sum_height += trend_height + min_tree_height;
				sum_min_tree_height += min_tree_height;
				sum_other_height += trend_height;
			}
			else{
				sum_height += trend_height;
				sum_other_height += trend_height;
			}
		}
		if(sum_height < height){
			var k = (height - (mult_tree_smaller.length+1) * bottom_padding - sum_other_height) / sum_min_tree_height;
			var tree_height;
			for(var j = 0; j < mult_tree_smaller.length; j++){
				if(mult_tree_smaller[j].mark_draw_all && !mult_tree_smaller[j].mark_only_flow){
					mult_tree_smaller[j].tree_height = k * min_tree_height;
					tree_height = mult_tree_smaller[j].tree_height;
					d3.select("#"+mult_tree_smaller[j].divid+" #tree_svg").attr("height",tree_height);
					$("#"+mult_tree_smaller[j].divid).height(tree_height+trend_height+bottom_padding);
				}
				else if(!mult_tree_smaller[j].mark_only_flow){
					mult_tree_smaller[j].tree_height = two_level_height;
					d3.select("#"+mult_tree_smaller[j].divid+" #tree_svg").attr("height",two_level_height);
					$("#"+mult_tree_smaller[j].divid).height(two_level_height+trend_height+bottom_padding);
				}
				else{
					d3.select("#"+mult_tree_smaller[j].divid+" #tree_svg").attr("height",0);
					$("#"+mult_tree_smaller[j].divid).height(trend_height+bottom_padding);
				}
			}
		}
		else{
			for(var j = 0; j < mult_tree_smaller.length; j++){
				if(mult_tree_smaller[j].mark_draw_all && !mult_tree_smaller[j].mark_only_flow){
					mult_tree_smaller[j].tree_height = min_tree_height;
					tree_height = min_tree_height;
					d3.select("#" + mult_tree_smaller[j].divid +" #tree_svg").attr("height",tree_height);
					$("#"+mult_tree_smaller[j].divid).height(tree_height+trend_height+bottom_padding);
				}
				else if(!mult_tree_smaller[j].mark_only_flow){
					mult_tree_smaller[j].tree_height = two_level_height;
					d3.select("#" + mult_tree_smaller[j].divid +" #tree_svg").attr("height",two_level_height);
					$("#"+mult_tree_smaller[j].divid).height(two_level_height+trend_height+bottom_padding);
				}
				else{
					d3.select("#"+mult_tree_smaller[j].divid+" #tree_svg").attr("height",0);
					$("#"+mult_tree_smaller[j].divid).height(trend_height+bottom_padding);
				}
			}
		}
	}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//树的数目改变时，改变树的布局
	function changeViewForSvg(){
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal,mult_tree_smaller[i].mark_draw_all,mult_tree_smaller[i],null,i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
		draw_flow_color();
	}
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	//清空视图中的树
	function delete_all_trees(){
		if(tmp_trend_height != 0){
			trend_height = tmp_trend_height;
			tmp_trend_height = 0;
		}
		for(var i = mult_tree_smaller.length - 1; i >= 0; i--){
			delete_tree(mult_tree_smaller[i].tree_id);
		}
		dataCenter.set_global_variable("selection_array",[]);
		dataCenter.set_global_variable("current_id",null);
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//收缩所有树,显示末两层
	function shrink_all_tree(){
		if(tmp_trend_height != 0){
			trend_height = tmp_trend_height;
			tmp_trend_height = 0;
		}
		for(var i = 0; i < mult_tree_smaller.length; i++){
			mult_tree_smaller[i].mark_draw_all = false;
			mult_tree_smaller[i].tree_height = two_level_height;
			mult_tree_smaller[i].mark_only_flow = false;
		}
		modify_height_svg_treeHeight();
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal,mult_tree_smaller[i].mark_draw_all,mult_tree_smaller[i],null,i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
	}
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//展开所有树
	function expand_all_tree(){
		if(tmp_trend_height != 0){
			trend_height = tmp_trend_height;
			tmp_trend_height = 0;
		}
		for(var i = 0; i < mult_tree_smaller.length; i++){
			mult_tree_smaller[i].mark_draw_all = true;
			mult_tree_smaller[i].mark_only_flow = false;
			mult_tree_smaller[i].tree_height = min_tree_height;
		}
		modify_height_svg_treeHeight();
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal,mult_tree_smaller[i].mark_draw_all,mult_tree_smaller[i],null,i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	//所有树仅显示流量
	function only_show_flow_all_tree(){
		for(var i = 0; i < mult_tree_smaller.length; i++){
			mult_tree_smaller[i].mark_only_flow = true;
		}
		modify_height_svg_treeHeight();
		nodes = tree.nodes(total_root);
		build_id_nodes(nodes);
		for(var i = 0; i < mult_tree_smaller.length; i++){
			draw_tree(mult_tree_smaller[i].mark_reversal,mult_tree_smaller[i].mark_draw_all,mult_tree_smaller[i],null,i);
			draw_trend(mult_tree_smaller[i].mark_reversal,i);
		}
		draw_dash_line();
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	//仅流量状态下，压缩高度
	function shortest_height_only_show_flow(){
		tmp_trend_height = trend_height;
		trend_height = (height - mult_tree_smaller.length * bottom_padding) / mult_tree_smaller.length;
		if(trend_height >= tmp_trend_height){
			trend_height = tmp_trend_height;
			tmp_trend_height = 0;
		}
		else if(trend_height < 25) trend_height = 25;
		if(cur_depth == 4) only_show_flow_all_tree();
		else {
			for(var i = 0; i < mult_tree_smaller.length; i++){
				mult_tree_smaller[i].mark_only_flow = true;
			}
			draw_depth(cur_depth);
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//为当前选中的signal tree添加黑色边框
	function add_border_of_current_signal_tree(){
		var tree_id = dataCenter.global_variable.current_id;
		if(tree_id == null) return;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			var tmp = mult_tree_smaller[i];
			if(tmp.tree_id == tree_id){
				d3.select("#" + tmp.divid)
					.style("border","1px solid")
					.style("border-color","#000000");
				d3.selectAll(".select_circle").attr("visibility","hidden");
				d3.select("#" + tmp.divid + " #selected_circle").attr("visibility","visible");
			}
			else {
				d3.select("#"+tmp.divid)
					.style("border","1px solid")
					.style("border-color","#FFFFFF");
			}
		}
	}
	///////////////////////////////////////////////////////////////////////////////////////////////////////
	//为柱状概览图中hover的树添加背景颜色
	function add_background_color_of_hovered_tree(){
		var tree_id = dataCenter.global_variable.mouse_over_signal_tree;
		for(var i = 0; i < mult_tree_smaller.length; i++){
			var tmp = mult_tree_smaller[i];
			if(tmp.tree_id == tree_id){
				d3.select("#" + tmp.divid)
					.style("background-color","#FFD2D2");
				break;
			}
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//去除所有背景颜色
	function clear_background_color_when_no_hovered_tree(){
		for(var i = 0; i < mult_tree_smaller.length; i++){
			var tmp = mult_tree_smaller[i];
			d3.select("#"+tmp.divid)
				.style("background-color",null);
		}
	}
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	var mark_show_similar = false;
    TreeCompare.OMListen = function(message, data) {
		var idmulti = "#compare-node-";
		if (message == "highlight") {
			d3.select("#multitree").selectAll(".highlight").classed("highlight", false)
			d3.select("#multitree").selectAll(".half-highlight").classed("half-highlight", false)
			for (var i = 0; i < data.length; i++) {
				var tmp_data = data[i].replace(';','');
				d3.select("#multitree").select(idmulti + tmp_data).classed("highlight", true);
				d3.select("#multitree").select(idmulti + tmp_data).each(function(d) {
					if (d == null) return;
					var node = d.parent;
					while (node != null) {
						var tmpid = node.id.replace(';','');
						d3.select("#multitree").select(idmulti + tmpid).classed("half-highlight", true);
						node = node.parent;
					}
				})				
			}
		}
        if(message == "mouse-over"){
        	for (var i = 0; i < data.length; i++) {
        		data[i] = data[i].replace(';','');
        		var tree_div;
        		for(var j = 0; j < mult_tree_smaller.length; j++){
        			if(mult_tree_smaller[j].tree_id == dataCenter.global_variable.current_id){
        				tree_div = mult_tree_smaller[j].divid;
        				break;
        			}
        		}
        		if(tree_div != undefined)
        			d3.select("#" + tree_div).selectAll(idmulti + data[i]).classed("focus-highlight",true);
        		highlight_subtree_root(data[i],dataCenter.global_variable.current_id,true);
			}
        }
        if(message == "mouse-out"){
        	for (var i = 0; i < data.length; i++) {
        		data[i] = data[i].replace(';','');
        		d3.select("#multitree").selectAll(idmulti + data[i]).classed("focus-highlight",false);
        		unhighlight_subtree_root();
			}
        }
        if(message == "set:mouse_over_signal_tree"){
        	if(data == null) clear_background_color_when_no_hovered_tree();
        	else{
        		clear_background_color_when_no_hovered_tree();
        		add_background_color_of_hovered_tree();
        	}
        }
        //pre_datasets_id记录上一次的所有信号树id，用于与本次的id数组比较，确定删除哪些，增加哪些
        if(message=="update-view"){
        	if(mark_show_similar){
        		cur_depth = dataCenter.GLOBAL_STATIC.MAX_DEPTH;
        		draw_depth(cur_depth);
        		mark_show_similar = false;
        	}
        	var self = this;
        	var addlist = [], add_id_list = [];
        	var dataCenter_datasets_idlist = [];
        	for(var i = 0; i < dataCenter.datasets.length; i++){
        		var tmp = dataCenter.datasets[i];
        		dataCenter_datasets_idlist.push(tmp.id);
        		if(pre_datasets_id.indexOf(tmp.id) == -1){
        			addlist.push(tmp.processor.result.treeRoot);
        			pre_datasets_id.push(tmp.id);
        			add_id_list.push(tmp.id);
        		}
        	}
        	var deletelist = [];
        	for(var i = 0; i < pre_datasets_id.length; i++){
        		var tmp = pre_datasets_id[i];
        		if(dataCenter_datasets_idlist.indexOf(tmp) == -1){
        			deletefrom = true;
        			delete_tree(tmp);
        			deletelist.push(i);
        		}
        	}
        	for(var i = deletelist.length - 1; i >= 0; i--){
        		pre_datasets_id.splice(deletelist[i],1);
        	}
        	if(addlist.length > 0) {
        		addMultiTree(addlist,add_id_list);
        	}
        	add_border_of_current_signal_tree();
        }
        if(message == "show-similiar"){
        	completelyShowSimilarPart();
        	mark_show_similar = true;
        }
        if(message == "show-all"){
        	draw_depth(dataCenter.GLOBAL_STATIC.MAX_DEPTH);
        	mark_show_similar = false;
        }
        if(message == "change-depth"){
        	var depth = +data;
        	draw_depth(depth);
        }
        if(message == "show-all-depth"){
        	add_tree_mode = 3;
        	expand_all_tree();
        }
        if(message == "show-two-depth"){
        	add_tree_mode = 2;
        	shrink_all_tree();
        }
        if(message == "show-only-flow"){
        	add_tree_mode = 1;
        	if(tmp_trend_height != 0){
				trend_height = tmp_trend_height;
				tmp_trend_height = 0;
			}
        	only_show_flow_all_tree();
        }
        if(message == "show-shortest-flow"){
        	add_tree_mode = 0;
        	shortest_height_only_show_flow();
        }        
        if(message == "delete_brush_g_in_comparison"){
			d3.selectAll(".created_g_for_brush").remove();
        }
        if(message == "add_brush_g_in_comparison"){
/*        	brush_compare.clear();
        	d3.select("#multitree").selectAll(".extent").attr("width",1).attr("x",1);*/
        }
    }
    return TreeCompare;
}