var treeSelect = {
	name: 'tree-select',
	nodeIdPrefix: '#tree-', 
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
		var svgWidth = $("#innerTopLeft").width();
		var svgHeight = $("#innerTopLeft").height();// * 19/20;
		var margin = {top: 20, right: 40, bottom: 20, left: 40},
    		width = svgWidth - margin.left - margin.right,
    		height = svgHeight - margin.top - margin.bottom;
    	var svg = null;
    	if(!$('.mainTimeline #mainTimeline').length > 0){
    		svg = d3.select('svg.mainTimeline')
				.attr('width', svgWidth)
				.attr('height', svgHeight)
				.append('g')
				.attr('id', 'mainTimeline')
				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    	}else{
    		svg = d3.select('.mainTimeline #mainTimeline')
    				.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    	}
		svg.selectAll("*").remove();
		var sortMode = dataCenter.global_variable.sort_mode;
		var renderData = null;
		if(sortMode == 'time'){
			renderData = dataCenter.global_variable.time_sort_array;
		}else if(sortMode == 'size'){
			renderData = dataCenter.global_variable.propotion_array;
		}
		var tip = d3.tip()
		  .attr('class', 'd3-tip')
		  .offset([-10, 0])
		  .html(function(d) {
		    return "Date: <span style='color:#ff5858'>" + d.time + "</span>"  + " flow:<span style='color:#ff5858'>" + d3.format(".3s")(d.value)+ "</span>";
		  });
		svg.call(tip);
		svg.append("rect")
			.attr('class','background-control-highlight')
			.attr('x',-10)
			.attr('y',-10)
			.attr('width',width + 20)
			.attr('height', height + 20)
			.attr('fill', 'white')
			.style('opacity', 0)
			.on('mouseout', function(d,i){
				self._remove_hover_arc_link();
				self._remove_current_label();
			});
		$('.toolbar-unhighlight').mouseover(function(){
			self._remove_hover_arc_link();
		});
		var xScale = d3.scale.linear()
			.domain([0, renderData.length])
			.range([0, width]);
		var yScale = d3.scale.linear()
			.domain([dataCenter.min_value, Math.log(dataCenter.max_value)])
			.range([height, 0]);
		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(0);
		var xAxisGroup = svg.append("g")
		   .attr("class","x axis")
		   .attr("transform","translate(" + 0 + "," + height + ")")
		   .call(xAxis);
		xAxisGroup.append("text")
		   .attr("class","label")
		   .style("text-anchor","end")
		   .attr('x', width)
		   .attr('y', 15)
		   .text("Date");
		var yAxisTicks = [];
		for(var i = 1; i < Math.log(dataCenter.maxNums)/3; i = i + 1){
			yAxisTicks.push(i * 3);
		}
		var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(yAxisTicks);
		var yAxisGroup = svg.append("g")
			.attr("class","y axis")
			.call(yAxis);
		yAxisGroup.append("text")
			.attr("class","label")
			.attr("x",0)
			.attr("y",-5)
			.attr("transform","rotate(-90)")
			.style("text-anchor","end")
			.text("log(Number\n(bytes))");

		var signalTree = svg.selectAll('.bar')
			.data(renderData, function(d,i){
				return d.time;
			})

			signalTree.enter()
			.append('rect')
			.attr('class', function(d,i){
				var classNameArray = ['bar']
				return self._group_class(classNameArray);
			})
			.attr('id', function(d,i){
				return 'tree-' + d.time;
			})
			.attr("width", function(d,i) {
				return xScale(1) * 0.8;
			})
			.attr("height",function(d,i){
				var logValue = 0;
				if(d.value != 0){
					logValue = Math.log(d.value);
				}
				return height - yScale(logValue);
			})
			.attr("y",function(d){
				var logValue = 0;
				if(d.value != 0){
					logValue = Math.log(d.value);
				}
				return yScale(logValue);
			})
			.attr("x",function(d,i){ 
				return 1 + xScale(i);
			})
			.on('mouseover', function(d,i){
				ObserverManager.post('mouseover-signal-tree', d.time);
			})
			.on('mouseout', function(d,i){
				//在鼠标从节点上面离开的时候不发送信号，这也就保证了overview上面的闪动的问题
				
			})
			.on('click', function(d,i){
				ObserverManager.post('click-signal-tree', d.time);
			});

			signalTree.attr('class', function(d,i){
				var classNameArray = ['bar']
				return self._group_class(classNameArray);
			})
			.attr('id', function(d,i){
				return 'tree-' + d.time;
			})
			.attr("width", function(d,i) {
				return xScale(1) * 0.8;
			})
			.attr("height",function(d,i){
				var logValue = 0;
				if(d.value != 0){
					logValue = Math.log(d.value);
				}
				return height - yScale(logValue);
			})
			.attr("y",function(d){
				var logValue = 0;
				if(d.value != 0){
					logValue = Math.log(d.value);
				}
				return yScale(logValue);
			})
			.attr("x",function(d,i){ 
				return 1 + xScale(i);
			})			
			.on('mouseover', function(d,i){
				ObserverManager.post('mouseover-signal-tree', d.time);
				tip.show(d);
			})
			.on('mouseout', function(d,i){
				//在鼠标从节点上面离开的时候不发送信号，这也就保证了overview上面的闪动的问题
				tip.hide(d);
			})
			.on('click', function(d,i){
				ObserverManager.post('click-signal-tree', d.time);
			});
			signalTree.exit().remove();
		self._draw_current_selection();
		self._draw_current_selection_text();
		self._draw_current_operation();
		self._add_arc_to_all();
	},
	/**
	 * 下面定义的三个方法借口在方法内部与方法外部通用
	 */
	//绘制当前选择信号树
	_draw_current_selection: function(){
		var self = this;
		var svg = d3.select('#mainTimeline');
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var nodeIdPrefix = self.nodeIdPrefix;
		//清空前期选择的节点
		svg.selectAll('.bar').classed('selection-highlight-negative', false);
		svg.selectAll('.bar').classed('selection-highlight-positive', false);
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].is_rolling_over){
				svg.select(nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-negative', true);
				svg.select(nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-positive', false);
			}else{
				svg.select(nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-positive', true);
				svg.select(nodeIdPrefix + selectionObjectArray[i].tree_name).classed('selection-highlight-negative', false);
			}
		}
	},
	//绘制当前操作信号树
	_draw_current_operation: function(){
		var self = this;
		var DURATION = 500;
		var svg = d3.select('#mainTimeline');
		var nodeIdPrefix = self.nodeIdPrefix;
		var operationSignalTreeName = dataCenter.global_variable.current_operation_tree_name;
		var nodeIdPrefix = self.nodeIdPrefix;
		var operationObjectArray = null;
		if(operationSignalTreeName != null){
			var operationSignalTreeNode = svg.select(nodeIdPrefix + operationSignalTreeName);
			var radius = +dataCenter.GLOBAL_STATIC.radius;
			var x = +operationSignalTreeNode.attr('x');
			var y = +operationSignalTreeNode.attr('y');
			var width = +operationSignalTreeNode.attr('width');
			var height = +operationSignalTreeNode.attr('height');
			var centerX = x + width/2;
			var centerY = y + height + 3 * radius;
			var operationObject = {'cx':centerX, 'cy': centerY};
			operationObjectArray = [operationObject];
		}else{
			operationObjectArray = [];
		}
		var operationCircle = svg.selectAll('.append-current-circle')
			.data(operationObjectArray);
		operationCircle.enter()
			.append('circle')
			.attr('class', 'append-current-circle')
			.attr('cx', centerX)
			.attr('cy', centerY)
			.attr('r', radius);
		operationCircle.transition()
			.duration(DURATION)
			.attr('cx', centerX)
			.attr('cy', centerY);
		operationCircle.exit().remove();
		if(operationSignalTreeName!=null){
			var operationSignalTreeObject = self._get_tree_object(operationSignalTreeName);
			self._change_current_label('label-A', operationSignalTreeObject);
		}
	},
	_change_current_label: function(div_id, signal_tree_object){
		$('#' + div_id + ' #node-type').removeClass('blue-label');
		$('#' + div_id + ' #node-type').removeClass('orange-label');
		$('#' + div_id + ' #node-type').removeClass('gray-label');		
		//if(signal_tree_object.tree_name != undefined){
		var isRollingOver = signal_tree_object.is_rolling_over;
		var treeNumber = '-';
		if(signal_tree_object.tree_number!=undefined){
			treeNumber = signal_tree_object.tree_number;
		}
		var flowNum = +signal_tree_object.flow;
		var flowNumber = d3.format(".3s")(flowNum) + "bytes";
		if(isRollingOver == true){
			$('#' + div_id + ' #node-type').addClass('orange-label');
		}else if(isRollingOver == false){
			$('#' + div_id + ' #node-type').addClass('blue-label');
		}else if(isRollingOver == undefined){
			$('#' + div_id + ' #node-type').addClass('gray-label');
		}
		if(signal_tree_object.date!=undefined){
			var signalTreeObjDate = signal_tree_object.date.split('-')[0];
			$('#' + div_id + ' #node-type').text(treeNumber);
			$('#' + div_id + ' .date-description').text(signalTreeObjDate);
			$('#' + div_id + ' .value-description').text(flowNumber);		
			$('#' + div_id + ' .level-description').text(signal_tree_object.max_level);
			$('#' + div_id + ' .level-0-description').text(signal_tree_object.l0);
			$('#' + div_id + ' .level-1-description').text(signal_tree_object.l1);
			$('#' + div_id + ' .level-2-description').text(signal_tree_object.l2);		
			$('#' + div_id + ' .level-3-description').text(signal_tree_object.l3);
			$('#' + div_id + ' .level-4-description').text(signal_tree_object.l4);		
			$('#' + div_id + ' .node-num-description').text(signal_tree_object.sum);
		}
	},
	_remove_current_label: function(){
		var div_id = 'label-C';
		$('#' + div_id + ' #node-type').text('-');
		$('#' + div_id + ' .date-description').text('-');
		$('#' + div_id + ' .value-description').text('-');		
		$('#' + div_id + ' .level-description').text('-');
		$('#' + div_id + ' .level-0-description').text('-');
		$('#' + div_id + ' .level-1-description').text('-');
		$('#' + div_id + ' .level-2-description').text('-');		
		$('#' + div_id + ' .level-3-description').text('-');
		$('#' + div_id + ' .level-4-description').text('-');		
		$('#' + div_id + ' .node-num-description').text('-');
	},
	_get_tree_object(required_tree_name){
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var required_tree_object = undefined;
		var allAttrObj = new Object();
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == required_tree_name){
				required_tree_object = selectionObjectArray[i];
			}
		}
		var allInfoDataObj = dataCenter.global_variable.all_info_obj;
		for(var i = 0;i < allInfoDataObj.length;i++){
			var date = allInfoDataObj[i].date;
			if(date == required_tree_name){
				allAttrObj = allInfoDataObj[i];
			}
		}
		if(required_tree_object != undefined){
			allAttrObj.is_rolling_over = required_tree_object.is_rolling_over;
			allAttrObj.tree_number = required_tree_object.tree_number;
		}
		return allAttrObj;
	},
	_get_tree_object_from_overall: function(required_tree_name){
		var allData = dataCenter.stats;
		var required_tree_object = undefined;
		for(var i = 0;i < allData.length;i++){
			var treeName = allData[i].file.replace('XX.csv','');
			if(treeName == required_tree_name){
				required_tree_object = allData[i];
				break;
			}
		}
		return required_tree_object;
	},
	//绘制当前鼠标悬停信号树
	_draw_current_hover: function(){
		var self = this;
		var svg = d3.select('#mainTimeline');
		var nodeIdPrefix = self.nodeIdPrefix;
		var signalTreeTime = dataCenter.global_variable.hover_tree_name;
		svg.selectAll('.bar').classed('mouseover-highlight', false);
		if(signalTreeTime != null){
			svg.select(nodeIdPrefix + signalTreeTime).classed('mouseover-highlight', true);
		}
		self._add_arc_to_one(signalTreeTime);
		var treeObject = self._get_tree_object;
		var hoverSignalTreeObject = self._get_tree_object(signalTreeTime);
		if(hoverSignalTreeObject != undefined){
			self._change_current_label('label-C', hoverSignalTreeObject);
		}	
	},
	_remove_current_hover: function(){
		var self = this;
		var svg = d3.select('#mainTimeline');
		svg.selectAll('.bar').classed('thinner-draw-hover-link', false);
		svg.select('.mouseover-highlight').classed('mouseover-highlight', false);
	},
	_draw_current_selection_text: function(){
		var self = this;
		var svg = d3.select('#mainTimeline');
		var nodeIdPrefix = self.nodeIdPrefix;
		svg.selectAll('.selection-text').remove();
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		for(var i = 0;i < selectionObjectArray.length;i++){
			draw_single_selection_text(selectionObjectArray[i]);
		}
		function draw_single_selection_text(selection_object){
			var selectionTreeObjectName = selection_object.tree_name;
			var selectionTreeObjectLabel = selection_object.tree_number;
			var nodeIdPrefix = self.nodeIdPrefix;
			var operationSignalTreeNode = svg.select(nodeIdPrefix + selectionTreeObjectName);
			var x = +operationSignalTreeNode.attr('x');
			var y = +operationSignalTreeNode.attr('y');
			var width = +operationSignalTreeNode.attr('width');
			var height = +operationSignalTreeNode.attr('height');
			var textY = y - 3, textX = x + width / 2;
			svg.append('text')
				.attr('class', 'selection-text')
				.attr("text-anchor", "middle")
				.attr('x', textX)
				.attr('y', textY)
				.text(selectionTreeObjectLabel);
		}
	},
	//将需要的class组合在一起的到元素的class
	 _group_class: function(class_name_array){
	 	var className = '';
	 	for(var i = 0;i < class_name_array.length;i++){
	 		className = className + ' ' + class_name_array[i];
	 	}
	 	return className;
	 },
	 _add_arc_to_all: function(){
	 	var self = this;
	 	var svg = d3.select('#mainTimeline');
	 	var arcClass = 'default-arc-link';
	 	svg.selectAll('.default-arc-link').remove();
	 	var similarityObjectMatrix = dataCenter.global_variable.similarity_object_matrix;
	 	//首先将相似度矩阵转换为对象的数组
	 	for(var i = 0;i < similarityObjectMatrix.length;i++){
	 		var originName = similarityObjectMatrix[i][0].origin_name;
	 		var targetName = similarityObjectMatrix[i][0].target_name;
	 		self._draw_arc(originName, targetName, arcClass);
	 	}
	 },
	 _add_arc_to_one:function(signal_tree_name){
	 	var self = this;
	 	var operationSimilarArray = dataCenter.global_variable.operation_similar_array;
	 	var index = operationSimilarArray.indexOf(signal_tree_name);
	 	if((signal_tree_name == undefined) || (operationSimilarArray.indexOf(signal_tree_name) != -1)){
	 		signal_tree_name = dataCenter.global_variable.current_operation_tree_name;
	 	}
	 	if((signal_tree_name != undefined)&&(signal_tree_name != null)){
	 		var nodeIdPrefix = self.nodeIdPrefix;
	 		var svg = d3.select('#mainTimeline');
		 	var arcClass = 'hover-arc-link';
		 	svg.selectAll('.hover-arc-link').remove();
		 	var similarityObjectMatrix = dataCenter.global_variable.similarity_object_matrix;
		 	//绘制每一个信号树的连接之前，将默认的信号树连接透明度降低
		 	svg.selectAll('.bar').classed('thinner-draw-hover-link', true);
		 	svg.selectAll('.bar').classed('mouseover-other-nodes-unhighlight', false);
		 	svg.selectAll('.bar').style('fill', '#C0C0C0');		 	
		 	svg.selectAll('.default-arc-link').classed('thinner-draw-hover-link', true);
		 	svg.selectAll('.arc-num-label').remove();
			var opacityScale = d3.scale.linear()
				.domain([0, dataCenter.global_variable.hover_arc_link_num])
				.range([0,1]);
			var dark = d3.rgb(200,200,200);
			var bright = d3.rgb(50,50,50);
			var compute = d3.interpolate(bright,dark); 
		 	//首先将相似度矩阵转换为对象的数组
		 	for(var i = 0;i < similarityObjectMatrix.length;i++){
		 		var originName = similarityObjectMatrix[i][0].origin_name;
		 		if(originName == signal_tree_name){
		 			for(var j = 0;j < dataCenter.global_variable.hover_arc_link_num;j++){//
		 				var fillColorRectAndArc = compute(opacityScale(j));
		 				var targetName = similarityObjectMatrix[i][j].target_name;
		 				svg.select(nodeIdPrefix + targetName)
		 					.classed('mouseover-other-nodes-unhighlight', true);
		 				svg.select(nodeIdPrefix + targetName)
		 					.style('fill', fillColorRectAndArc);
				 		self._draw_arc(originName, targetName, arcClass, fillColorRectAndArc);
				 		self._add_arc_num_text(targetName, j);
		 			}
		 		}	
		 	}
	 	}
	 },
	 _remove_hover_arc_link: function(){
	 	var self = this;
	 	var svg = d3.select('#mainTimeline');
	 	svg.selectAll('.default-arc-link').classed('thinner-draw-hover-link', false);
	 	svg.selectAll('.hover-arc-link').remove();
	 	svg.selectAll('.mouseover-highlight').classed('mouseover-highlight', false);
	 	svg.selectAll('.bar').classed('thinner-draw-hover-link', false);
	 	svg.selectAll('.bar').style('fill', '#C0C0C0');
	 	//当hover_arc_link_num不为0的时候重新绘制arc连接
	 	if(dataCenter.global_variable.hover_arc_link_num > 0){
	 		self._add_arc_to_one();
	 	}
	 },
	 _draw_arc: function(origin_tree_id, end_tree_id, arc_class, fill_color){
	 	var self = this;
	 	var svg = d3.select('#mainTimeline');
	 	var nodeIdPrefix = self.nodeIdPrefix;
	 	//计算得到起始与终止的rect的中心点，进一步计算arc的radius
	 	var startElement = svg.select(nodeIdPrefix + origin_tree_id);
	 	var endElement = svg.select(nodeIdPrefix + end_tree_id);
	 	var startX = +startElement.attr('x'), startWidth = +startElement.attr('width'), 
	 		startY = +startElement.attr('y'), startHeight = +startElement.attr('height');
	 	var startCenterX = startX + startWidth / 2, startCenterY = startY + startHeight;
	 	var endX = +endElement.attr('x'), endWidth = +endElement.attr('width');
	 	var endCenterX = endX + endWidth / 2, endCenterY = startCenterY, centerX = (startCenterX + endCenterX) / 2;
	 	var radius = Math.abs(endCenterX - startCenterX) / 2;
		var beginRadians = Math.PI / 2,
			endRadians = Math.PI * 3 / 2,
			points = 50;
		var angle = d3.scale.linear()
		 	.domain([0, points - 1])
			.range([beginRadians, endRadians]);
		var line = d3.svg.line.radial()
			.interpolate("basis")
	   		.tension(0)
	   		.radius(radius)
	   		.angle(function(d, i) { return angle(i); });
		svg.append("path").datum(d3.range(points))
	       .attr("class", function(d,i){
	       	  return arc_class;
	       })
		   .attr("d", line)
		   .attr("transform", "translate(" + centerX + ", " + endCenterY + ")")
		   .style('stroke', fill_color);
	 },
	 _add_arc_num_text: function(arc_link_tree_id, number){
		//防止选中的rect的text与顺序的text冲突
		var self = this;
		var nodeIdPrefix = self.nodeIdPrefix;
		var svg = d3.select('#mainTimeline');
		var haveAddedNow = false;
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == arc_link_tree_id){
				haveAddedNow = true;
				break;
			}
		}
		if(!haveAddedNow){
			var selectionArray = dataCenter.global_variable.selection_array;
			var thisNode = d3.select(nodeIdPrefix + arc_link_tree_id);
			var thisX = +thisNode.attr('x');
			var thisY = +thisNode.attr('y');
			var thisWidth = +thisNode.attr('width');
			var centerX = thisX + thisWidth / 2; 
			var centerY = thisY - 2;
			svg.append('text')
				.attr('class', 'arc-num-label')
				.attr('x', centerX)
				.attr('y', centerY)
				.attr('text-anchor', 'middle')
				.text(number + 1);
		}
	},
	hide_default_arc_link: function(){
		console.log('hidden');
		var svg = d3.select('#mainTimeline');
		svg.selectAll('.default-arc-link').attr('visibility', 'hidden');
	},
	show_default_arc_link: function(){
		console.log('show');
		var svg = d3.select('#mainTimeline');
		svg.selectAll('.default-arc-link').attr('visibility', 'visible');
	},
	switch_selection: function(){
		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
		var operationTreeIndex = 0;
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == currentOperationTreeName){
				operationTreeIndex = i;
				break;
			}
		}
		var nextOperationTreeIndex = (operationTreeIndex + 1)%(selectionObjectArray.length);
		dataCenter.global_variable.current_operation_tree_name = selectionObjectArray[nextOperationTreeIndex].tree_name;
		ObserverManager.post('draw-current-operation');
	},
	clear_selection: function(){
		dataCenter.set_global_variable('selection_object_array', []);
		dataCenter.set_global_variable('current_operation_tree_name', null);
		ObserverManager.post('draw-current-selection');
		ObserverManager.post('draw-current-operation');
	},
	OMListen: function(message, data){
		var self = this;
		if(message == 'draw-current-selection'){
			self._draw_current_selection();
			self._draw_current_selection_text();
		}else if(message == 'draw-current-operation'){
			self._draw_current_operation();
		}else if(message == 'draw-current-hover'){
			self._draw_current_hover();
		}else if(message == 'remove-current-hover'){
			self._remove_current_hover();
			self._remove_current_label();
		}else if(message == 'set:hover_arc_link_num'){
			self._add_arc_to_one();
		}else if(message == 'set:show_arc'){
            if(dataCenter.global_variable.show_arc){
                self.hide_default_arc_link();
            }else{
                self.show_default_arc_link();
            }
        }else if(message == 'set:sort_mode'){
        	self._render_view();
        }else if(message == 'switch-selection-data'){
        	self.switch_selection();
        }else if(message == 'clear-selection'){
        	self.clear_selection();
        }
	}
}