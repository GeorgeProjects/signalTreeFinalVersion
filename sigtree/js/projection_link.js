var projectionLink = {
	name:'projection-link-view',
	nodeIdPrefix: 'projection-link-tree-', 
	nodeLocation:[],
	initialize: function(){
		var self = this;
		self._add_to_listener();
		self._bind_view();
		self._render_view();
	},
	_add_to_listener: function(){
		var self = this;
		ObserverManager.addListener(self);
	},
	_bind_view: function(){
	},
	_render_view: function(){
		var self = this;
		var padding  = 10;
		var svgWidth = $('#projectionLinkWrapper').width(); 
		var svgHeight = $('#projectionLinkWrapper').height();
		var margin = {top: 10, bottom: 10, right: 10, left: 10}
			width = svgWidth - margin.left - margin.right;
			height = svgHeight - margin.top - margin.bottom;
		var nodeIdPrefix = self.nodeIdPrefix;	
		var tip = d3.tip()
		  .attr('class', 'd3-tip')
		  .offset([-10, 0])
		  .html(function(d) {
		    return "Date: <span style='color:#ff5858'>" + d[2] + "</span>";
		  });
		var svg = d3.select('svg.projection-link')
			.attr('width', svgWidth)
			.attr('height', svgWidth)
			.append('g')
			.attr('id', 'projection-link')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
		svg.call(tip);
		svg.selectAll('*').remove();
		svg.append('rect')
			.attr('id', 'projection-background')
			.attr('width', width)
			.attr('height', height)
			.attr('x', 0)
			.attr('y', 0)
			.style('opacity', 0)
			.on('mouseover', function(){
				svg.selectAll('.projection-nodes').classed('mouseover-highlight', false);
				ObserverManager.post('mouseout-signal-tree', null);
			});
		var selectionArray = dataCenter.global_variable.selection_array;
		var mdsByDistance = window["MDS"]["byDistance"];
		var coordinate = mdsByDistance(dataCenter.distanceMatrix);
		var nodeNum = coordinate.length;
		var nodeLocation = new Array(nodeNum);
		self.nodeLocation = nodeLocation;
		for(var i = 0;i < nodeNum;i++){
			nodeLocation[i] = new Array();
			nodeLocation[i][0] = coordinate[i][0] * width;
			nodeLocation[i][1] = coordinate[i][1] * height;
			nodeLocation[i][2] = dataCenter.distanceObject[i].fileName;
		}
		self.draw_link();
		//self.draw_link(nodeLocation);	
		//对于绘制的节点数组进行排序，避免重叠的现象
		nodeLocation.sort(function(a, b){
			return selectionArray.indexOf(b[2]) - selectionArray.indexOf(a[2]);
		});
		var sigTreeNode = svg.selectAll(".projection-nodes")
	    .data(nodeLocation);
	  	
	  	sigTreeNode.enter()
	  	.append("circle")
	  	.attr('class', function(d,i){
	  		var classNameArray = ['projection-nodes']
			return self._group_class(classNameArray);
	  	})
		.attr('id', function(d,i){
			return nodeIdPrefix + d[2];
		})
		.attr('cx', function(d,i){
			return d[0];
		})
		.attr('cy', function(d,i){
			return d[1];
		})
	    .on('mouseover', function(d,i){
			//send message, highlight the corresponding histogram
			ObserverManager.post('mouseover-signal-tree', d[2]);
			if(dataCenter.global_variable.enable_tooltip){
				tip.show(d);
			}
		})
		.on('mouseout', function(d,i){
			ObserverManager.post('mouseout-signal-tree', d[2]);
			tip.hide(d);
		})
		.on('click', function(d,i){
			ObserverManager.post('click-signal-tree', d[2]);
		});

		sigTreeNode.attr('class', function(d,i){
	  		var classNameArray = ['projection-nodes']
			return self._group_class(classNameArray);
	  	})
		.attr('id', function(d,i){
			return nodeIdPrefix + d[2];
		})
		.attr('cx', function(d,i){
			return d[0];
		})
		.attr('cy', function(d,i){
			return d[1];
		})
	    .on('mouseover', function(d,i){
			//send message, highlight the corresponding histogram
			ObserverManager.post('mouseover-signal-tree', d[2]);
			if(dataCenter.global_variable.enable_tooltip){
				tip.show(d);
			}
		})
		.on('mouseout', function(d,i){
			ObserverManager.post('mouseout-signal-tree', d[2]);
			tip.hide(d);
		})
		.on('click', function(d,i){
			ObserverManager.post('click-signal-tree', d[2]);
		});
		svg.append('text')
		.attr('class', 'label-start-end-projection-link')
		.attr('id', 'text-' + nodeLocation[0][2])
		.attr('x', nodeLocation[0][0])
		.attr('y', nodeLocation[0][1])
		.text('start');
		svg.append('text')
		.attr('class', 'label-start-end-projection-link')
		.attr('id', 'text-' + nodeLocation[(nodeNum - 1)][2])
		.attr('x', nodeLocation[(nodeNum - 1)][0])
		.attr('y', nodeLocation[(nodeNum - 1)][1])
		.text('end');
		sigTreeNode.exit().remove();
		self._draw_current_selection();
		self._draw_current_operation();
	},
	//绘制当前选择信号树
	_draw_current_selection: function(){
		var self = this;
		var svg = d3.select('#projection-link');
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var nodeIdPrefix = self.nodeIdPrefix;
		//清空前期选择的节点
		svg.selectAll('.projection-nodes').classed('selection-highlight-negative', false);
		svg.selectAll('.projection-nodes').classed('selection-highlight-positive', false);
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].is_rolling_over){
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-negative', true);
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-positive', false);
			}else{
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-positive', true);
				svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-negative', false);
			}
		}
		self._put_selection_node_top();
	},
	//绘制当前鼠标悬停信号树
	_draw_current_hover: function(){
		var self = this;
		var svg = d3.select('#projection-link');
		var nodeIdPrefix = self.nodeIdPrefix;
		var signalTreeTime = dataCenter.global_variable.hover_tree_name;
		svg.selectAll('.projection-nodes').classed('thinner-draw-hover-link', true);
		svg.selectAll('.projection-nodes').classed('mouseover-highlight', false);
		//在将节点移动到另外一个节点之前需要将选择的信号树重新绘制一遍，从而保证当前选择的信号树不会被覆盖
		self._draw_current_selection();
		if(signalTreeTime != null){
			//self._re_draw_node(svg.select(nodeIdPrefix + signalTreeTime));
			svg.select('#' + nodeIdPrefix + signalTreeTime).classed('mouseover-highlight', true);
		}
	},
	_remove_current_hover: function(){
		var self = this;
		var svg = d3.select('#projection-link');
		svg.selectAll('.projection-nodes')
			.classed('thinner-draw-hover-link', false);
		self._draw_current_selection();
	},
	_draw_current_operation: function(){
		var self = this;
		var svg = d3.select('#projection-link');
		var nodeIdPrefix = self.nodeIdPrefix;
		svg.selectAll('.current-operation-highlight').classed('current-operation-highlight', false);
		var operationSignalTreeName = dataCenter.global_variable.current_operation_tree_name;
		svg.select('#' + nodeIdPrefix + operationSignalTreeName)
			.classed('current-operation-highlight', true);
	},
	//将需要的class组合在一起的到元素的class
	 _group_class: function(class_name_array){
	 	var className = '';
	 	for(var i = 0;i < class_name_array.length;i++){
	 		className = className + ' ' + class_name_array[i];
	 	}
	 	return className;
	 },
	 _put_selection_node_top: function(){
	 	var self = this;
	 	var nodeIdPrefix = self.nodeIdPrefix;
	 	var svg = d3.select('#projection-link');
	 	var selectionObjectArray = dataCenter.global_variable.selection_object_array;
	 	for(var i = 0;i < selectionObjectArray.length;i++){
	 		var thisNode = svg.select('#' + nodeIdPrefix + selectionObjectArray[i].tree_name);
	 		if(thisNode[0][0] != null){
	 			self._re_draw_node(thisNode);
	 		}
	 	}
	 	svg.selectAll('.selection-highlight-positive')
	 	.each(function(d,i){
	 		var thisNode = d3.select(this);
	 		if(thisNode[0][0] != null){
	 			self._re_draw_node(thisNode);
	 		}
	 	});
	 	svg.selectAll('.selection-highlight-negative')
	 	.each(function(d,i){
	 		var thisNode = d3.select(this);
	 		if(thisNode[0][0] != null){
	 			self._re_draw_node(thisNode);
	 		}
	 	});
	 },
	_re_draw_node: function(this_node){
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix;
		var svg = d3.select('#projection-link');
		var thisClass = this_node.attr('class');
		var thisId = this_node.attr('id');
		var thisCx = +this_node.attr('cx');
		var thisCy = +this_node.attr('cy');
		svg.append('circle')
			.attr('class', function(d,i){
				return thisClass;
			})
			.attr('id', function(d,i){
				return thisId;
			})
			.attr('cx', thisCx)
			.attr('cy', thisCy)
			.on('mouseover', function(d,i){
				var thisId = d3.select(this).attr('id');
				var thisName = thisId.replace(nodeIdPrefix,'');
				ObserverManager.post('mouseover-signal-tree', thisName);
			})
			.on('mouseout', function(d,i){
				var thisId = d3.select(this).attr('id');
				var thisName = thisId.replace(nodeIdPrefix,'');
				ObserverManager.post('mouseout-signal-tree', thisName);
			})
			.on('click', function(d,i){
				var thisId = d3.select(this).attr('id');
				var thisName = thisId.replace(nodeIdPrefix,'');
				ObserverManager.post('click-signal-tree', thisName);
			});
		this_node.remove();
	},
	OMListen: function(message, data){
		var self = this;
		if(message == 'draw-current-selection'){
			self._draw_current_selection();
		}else if(message == 'draw-current-operation'){
			self._draw_current_operation();
		}else if(message == 'draw-current-hover'){
			self._draw_current_hover();
		}else if(message == 'remove-current-hover'){
			self._remove_current_hover();
		}
	},
	add_start_end_text: function(){
		var self = this;
		var svg = d3.select('svg.projection-link');
		var nodeLocation = self.nodeLocation;
		var nodeLocationLength = nodeLocation.length;
		var startId = self.nodeLocation[0][2];
		var endId = self.nodeLocation[nodeLocationLength - 1][2];
		var startCx = svg.select('#node' + startId).attr('cx');
		var startCy = svg.select('#node' + startId).attr('cy');
		var endCx = svg.select('#node' + endId).attr('cx');
		var endCy = svg.select('#node' + endId).attr('cy');
		svg.append('text')
			.attr('id', 'projection-link-start')
			.attr("text-anchor", "middle")
			.attr('x', startCx)
			.attr('y', startCy - 6)
			.text('start');
		svg.append('text')
			.attr('id', 'projection-link-end')
			.attr("text-anchor", "middle")
			.attr('x', endCx)
			.attr('y', endCy - 6)
			.text('end');
	},
	append_selection_text: function(){
		var svg = d3.select('svg.projection-link');
		var selectionArray = dataCenter.global_variable.selection_array;
		svg.selectAll('.opacity-click-highlight')
		.each(function(d,i){
			var cx = d3.select(this).attr('cx');
			var cy = d3.select(this).attr('cy');
			var nodeId = d3.select(this).attr('id').replace('node','');
			var nodeIndex = selectionArray.indexOf(nodeId);
			svg.append('text')
			.attr("text-anchor", "middle")
			.attr('x', cx)
			.attr('y', cy - 6)
			.text(nodeIndex);
		})
	},
	draw_link: function(){
		var self = this;
		var nodeLocation = _.clone(self.nodeLocation);
		var similiarNodeArray = new Array();
		for(var i = 0;i < nodeLocation.length;i++){
			var x = nodeLocation[i][0];
			var y = nodeLocation[i][1];
			var findSimiliarNode = false;
			//遍历similiarNodeArray数组，判断是否已经存在临近的节点被存储
			for(var j = 0;j < similiarNodeArray.length;j++){
				var templateX = similiarNodeArray[j].x;
				var templateY = similiarNodeArray[j].y;
				//为什么取10
				if((Math.abs(templateY - y) <= 20) && (Math.abs(templateX - x) <= 20)){
					similiarNodeArray[j].nodeArray.push(nodeLocation[i]);
					similiarNodeArray[j].sumX = similiarNodeArray[j].sumX + x;
					similiarNodeArray[j].sumY = similiarNodeArray[j].sumY + y;
					similiarNodeArray[j].x = Math.round(similiarNodeArray[j].sumX/similiarNodeArray[j].nodeArray.length);
					similiarNodeArray[j].y = Math.round(similiarNodeArray[j].sumY/similiarNodeArray[j].nodeArray.length);
					findSimiliarNode= true;
					break;
				}
			}
			if(findSimiliarNode == false){
				similiarNodeArray[j] = new Object();
				similiarNodeArray[j].nodeArray = [nodeLocation[i]];
				similiarNodeArray[j].sumX = +x;
				similiarNodeArray[j].sumY = +y;
				similiarNodeArray[j].x = Math.round(similiarNodeArray[j].sumX/similiarNodeArray[j].nodeArray.length);
				similiarNodeArray[j].y = Math.round(similiarNodeArray[j].sumY/similiarNodeArray[j].nodeArray.length);
			}
		}
		var ModifyNodeArray = new Array();
		for(i = 0;i < similiarNodeArray.length;i++){
			var templateX = similiarNodeArray[i].x;
			var templateY = similiarNodeArray[i].y;
			var nodeArray = similiarNodeArray[i].nodeArray;
			for(var j = 0;j < nodeArray.length;j++){
				ModifyNodeArray.push([templateX, templateY, nodeArray[j][2]]);
			}
		}
		var svg = d3.select('#projection-link');
		var path = svg.append("path")
			.attr('class', 'projection-node-path')
		    .data([ModifyNodeArray])
		    .attr("d", d3.svg.line()
		    .tension(4) // Catmull–Rom
		    .interpolate("monotone"));//cardinal-open
		    /*
		    linear - 线性插值
			linear-closed - 线性插值，封闭起点和终点形成多边形
			step - 步进插值，曲线只能沿x轴和y轴交替伸展
			step-before - 步进插值，曲线只能沿y轴和x轴交替伸展
			step-after - 同step
			basis - B样条插值
			basis-open - B样条插值，起点终点不相交
			basis-closed - B样条插值，连接起点终点形成多边形
			bundle - 基本等效于basis，除了有额外的tension参数用于拉直样条
			cardinal - Cardina样条插值
			cardinal-open - Cardina样条插值，起点终点不相交
			cardinal-closed - Cardina样条插值，连接起点终点形成多边形
			monotone - 立方插值，保留y方向的单调性
		     */
		function translateAlong(path) {
		  var l = path.getTotalLength();
		  return function(d, i, a) {
		    return function(t) {
		      var p = path.getPointAtLength(t * l);
		      return "translate(" + p.x + "," + p.y + ")";
		    };
		  };
		}
	},
	OMListen: function(message, data){
		var self = this;
		if(message == 'draw-current-selection'){
			self._draw_current_selection();
		}else if(message == 'draw-current-operation'){
			self._draw_current_operation();
		}else if(message == 'draw-current-hover'){
			self._draw_current_hover();
		}else if(message == 'remove-current-hover'){
			self._remove_current_hover();
		}
	}
}