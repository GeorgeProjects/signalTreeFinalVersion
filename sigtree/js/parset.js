var parset = {
	name: 'parset',
	initialize: function(){
		var self = this;
		self._add_to_listener();
		self._bind_view();
		self._render_view();
		return self;
	},
	_add_to_listener: function(){
		var self = this;
		ObserverManager.addListener(self);
	},
	_bind_view: function(){
	},
	_render_view: function(){
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
		if(currentOperationTreeName == null){
			d3.select("svg.parset").selectAll('*').remove();
			return;
		}
		var treeRoot = null, isRollingOver = false, dataList = [];
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == currentOperationTreeName){
				treeRoot = selectionObjectArray[i].tree_root;
				isRollingOver = selectionObjectArray[i].is_rolling_over;
				dataList = selectionObjectArray[i].data_list;
				break;
			}
		}
		var tree = self.tree = d3.layout.tree()
			.children(function(d){
				if(Array.isArray(d.values)) return d.values;
				return undefined;
			});
		var treeNodeList = [];
		if(treeRoot != null){
			treeNodeList = tree.nodes(treeRoot).reverse();
		}
		var width = +$("#leftBottomWrapper").width();
		var height = +$("#leftBottomWrapper").height();
		var svg = d3.select("svg.parset")
		  .attr("width", width)
		  .attr("height", height);
		var tip = d3.tip()
	    .attr('class', 'd3-tip')
	    .offset([-10, 0])
	    .html(function(d) {
	    	return "Name: <span style='color:#ff5858'>" + d.name + "</span>"  + " flow:<span style='color:#ff5858'>" + d3.format(".3s")(d.count)+ "</span>";
	    });
	    var dimensionsArray = ["root", "atm", "aal", "vpi", "cid"];
		var chart = d3.parsets()
				.dimensions(dimensionsArray)
				.value(function(d){
					var strs = d.percent.split(",");
					if (strs.length == 0)
						return 0;
					var value = strs[0].replace("数量：", "").replace("字节", "");
					value = +value;
					return value;
				})
				.width(width - 20)
				.height(height-20)
				.mouseoverCallback(mouseoverCallback)
				.mouseoutCallback(mouseoutCallback)
				.spacing(110)
				.tension(0.5);
		var data = [];
		dataList.forEach(function(d){
			d.root = "root";
			if(d.tcp){
				d.cid = d.tcp;
				delete d.tcp;
			}
			else if(d.udp){
				d.cid = d.udp;
				delete d.udp;
			}
			else if(d.icmp){
				d.cid = d.icmp;
				delete d.icmp;
			}
			else if(d.other){
				d.cid = d.other;
				delete d.other;
			}
			if(!d.cid){
				d.cid = "none";
			}
			data.push(d);
		});
		svg.datum(data).call(chart);
		svg.call(tip);
		svg.selectAll('path')
		.attr('class', function(d,i){
			var pathClass = null;
			if(isRollingOver){
				pathClass = 'orange-path';
			}else{
				pathClass = 'blue-path';
			}
			return pathClass;
		})
		.on('mouseover', function(d,i){
			dataCenter.global_variable.current_mouseover_signaltree = dataCenter.global_variable.current_operation_tree_name;
			var nodeAttrObj = get_tree_node(d.id);
			var clickNode = {
				tree_label: dataCenter.global_variable.current_id,
				node: nodeAttrObj,
			};
			dataCenter.set_global_variable('mouse_over_signal_node', clickNode);
			if(dataCenter.global_variable.enable_tooltip){
				tip.show(d);
			}
		})
		.on('mouseout', function(d,i){
			dataCenter.set_global_variable('mouse_over_signal_node', null);
			if(dataCenter.global_variable.enable_tooltip){
				tip.hide(d);
			}
		});
		svg.selectAll("rect")
		.on("mouseover",function(){
			if(d3.select(this).attr("class") != "category-0") return;
			d3.select(this).classed('focus-highlight', true);
			ObserverManager.post("mouse-over", ["-root"]);
		})
		.on("mouseout",function(){
			if(!d3.select(this).classed("category-0")){
				return;
			}
			d3.selectAll('.focus-highlight').classed('focus-highlight', false);
			ObserverManager.post("mouse-out", ["-root"]);
		});
		svg.selectAll("path")
		.filter(function(d){
			var tmp = d.id.slice(-4);
			if(tmp == "none") return true;
			return false;
		})
		.attr("opacity",0);
		svg.selectAll("g")
		.filter(function(d){
			if(d.name == "none") {
				return true;
			}
			return false;
		})
		.attr("opacity",0);
		svg.select('.ribbon-mouse').selectAll('*').style('opacity', 0);
		function mouseoverCallback(data) {
			ObserverManager.post("mouse-over", [data.id])
		}
		function mouseoutCallback(data) {
			ObserverManager.post("mouse-out", [data.id])
		}
		function get_tree_node(id){
			for(var i = 0;i < treeNodeList.length;i++){
				if(treeNodeList[i].id == id){
					return treeNodeList[i];
				}
			}
			return null;
		}
	},
	_highlight_subtree_and_route_from_root: function(dataI) {
		var svg = d3.select("svg.parset");
		var highlight_id_list = dataCenter.global_variable.radial_highlight_id_list;
		for(var i = 0; i < highlight_id_list.length; i++){
			svg.selectAll("#parset-mouse-" + highlight_id_list[i])
				.classed("on-hover-route-path",true);
		}
	},
	_unhighlight_subtree_root: function(){
		var svg = d3.select("svg.parset");
		svg.selectAll("path")
			.classed("on-hover-route-path",false);
		dataCenter.set_global_variable('radial_highlight_id_list', []);
	},
    OMListen: function(message, data) {
    	var self = this;
		var idPrefix = "#parset-ribbon-";
		var idMousePrefix = '#parset-mouse-';
		var svg = d3.select("svg.parset");
		if (message == "highlight") {
			svg.selectAll(".half-highlight").classed('half-highlight', false);
			//svg.selectAll('.highlight').classed('highlight', false);
			for (var i = 0; i < data.length; i++) {
				if(data[i] != undefined){
					var dataI = data[i].replace(';','');
					svg.select(idPrefix + dataI).classed('half-highlight', true);
					//svg.select(idMousePrefix + nodeObj.id).style("display", 'hidden');
					var nodeObj = _find_node_object(dataI);
					while(nodeObj != null){
						svg.select(idPrefix + nodeObj.id).classed('half-highlight', true);
					//	$(idMousePrefix + nodeObj.id).("display", 'hidden');
						nodeObj = nodeObj.parent;
					}
				}
			}
		}
		function _find_node_object(node_id){
			var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
			var selectionObjectArray = dataCenter.global_variable.selection_object_array;
			for(var i = 0;i < selectionObjectArray.length;i++){
				if(selectionObjectArray[i].tree_name == currentOperationTreeName){
					var selectionTreeNodes = selectionObjectArray[i].tree_nodes;
					for(var j = 0;j < selectionTreeNodes.length;j++){
						if(selectionTreeNodes[j].id == node_id){
							return selectionTreeNodes[j];
						}
					}
				}
			}
		}
        if (message == "mouse-over") {
        	var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
        	var current_mouseover_signaltree = dataCenter.global_variable.current_mouseover_signaltree;
        	svg.select('.ribbon-mouse').selectAll('*').style('opacity', 1);
        	if(currentOperationTreeName == current_mouseover_signaltree){
				for (var i = 0; i < data.length; i++) {
					if(data[i] != undefined){
						var dataI = data[i].replace(';','');
						svg.selectAll("#parset-ribbon-" + dataI).classed("focus-highlight", true);
						svg.selectAll("#parset-mouse-" + dataI).classed("focus-highlight", true);	
						self._highlight_subtree_and_route_from_root(dataI);
					}
				}
			}
        }
        if (message == "mouse-out") {
			//svg.select('.ribbon-mouse').selectAll('*').style('opacity', 0);
			for (var i = 0; i < data.length; i++) {
				if(data[i] != undefined){
					var dataI = data[i].replace(';','');
					svg.selectAll("#parset-ribbon-" + dataI).classed("focus-highlight", false);
					svg.selectAll("#parset-mouse-" + dataI).classed("focus-highlight", false);
				}
			}        	
			self._unhighlight_subtree_root();
        }
        if(message=="update-view"){
        	var currentId = dataCenter.global_variable.current_id;
        	for(var i = 0;i < dataCenter.datasets.length;i++){
        		if(currentId == dataCenter.datasets[i].id){
        			var dataList = dataCenter.datasets[i].processor.result.dataList;
        			self._render_view(dataList);
        			break;
        		}
        	}
        }
        if(message == 'draw-current-operation'){
			self._render_view();
		}
        if(message == "set:similar_id_array"){
        	var similarIdArray = dataCenter.global_variable.similar_id_array;
        	svg.selectAll('path')
        	.classed('path-remove', true);
        	//classed('opacity-non-similar', true);
        	for(var i = 0;i < similarIdArray.length;i++){
        		svg.select('#parset-ribbon-' + similarIdArray[i]).classed('path-remove', false);//.style('opacity', '1');
        	}
        }
        if(message == 'show-all'){
        	svg.selectAll('path')
        	.classed('path-remove', false);
        }
        if(message == 'clean-view'){
        	svg.selectAll('*').remove();
        }
    }	
};