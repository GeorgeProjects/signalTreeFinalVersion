var radialHistogram = {
	name: 'radialhistogram',
	initialize: function(){
		var self = this;
		self._add_to_listener();
		self._bind_view();
		self._render_view();
		return self;
	},
	_add_to_listener: function(){
		ObserverManager.addListener(this);
	},
	_bind_view: function(){},
	_render_view: function(){
		var self = this;
		var width = $('#leftTopRightBottomWrapper').width();
		var height = $('#leftTopRightBottomWrapper').height();
		var margin = {top: 20, bottom: 30, right: 30, left: 50},
			width = width - margin.left - margin.right,
			height = height - margin.top - margin.bottom;

		var selectionObjectArray = dataCenter.global_variable.selection_object_array;
		var currentOperationTreeName = dataCenter.global_variable.current_operation_tree_name;
		if(currentOperationTreeName == null){
			$('#histogram-label').css('visibility', 'hidden');
			d3.select("svg.radial-histogram").selectAll('*').remove();
			return;
		}			
		$('#histogram-label').css('visibility', 'visible');
		var treeRoot = null, isRollingOver = false;
		for(var i = 0;i < selectionObjectArray.length;i++){
			if(selectionObjectArray[i].tree_name == currentOperationTreeName){
				treeRoot = selectionObjectArray[i].tree_root;
				isRollingOver = selectionObjectArray[i].is_rolling_over;
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
		d3.select('#histogram').selectAll("*").remove();

		var svg = d3.select("svg.radial-histogram")
			.attr('width', width + margin.right + margin.left)
			.attr('height', height + margin.top + margin.bottom)
			.attr('id', 'histogram')
			.on('mouseenter',function(){
				ObserverManager.post("delete_brush_g_in_comparison");
			})
			.on('mouseleave',function(){
				ObserverManager.post("add_brush_g_in_comparison");
			})
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
			.attr('id', 'radial-histogram-svg');
			//.attr('width', width - paddingLeft - paddingRight)
			//.attr('height', height - paddingTop - paddingBottom)
			//.attr('transform', 'translate(' + paddingLeft + ',' + paddingTop +')');

		self._draw_his(treeNodeList, margin);
	},
	_draw_his: function(tree_node_list, margin){
		var self = this;
		var width = +$('#leftTopRightBottomWrapper').width() - margin.left - margin.right;
		var height = +$('#leftTopRightBottomWrapper').height() - margin.top - margin.bottom;
		var countArray = new Array();
		var multi = 4;
		var timeDataSum = 0;
		var dataSizeArray = new Array();
		var originalDataSizeArray = new Array();
		var eachTypeIdArray = new Array();
		var eachTypeIndexArray = new Array();
		var lineX = d3.scale.linear();
		var lineY = d3.scale.linear()
			.range([height ,0]);
		var yAxisTicks = new Array();
		var xAxisTicks = new Array();
		var objArray = new Array();
		var brush = d3.svg.brush().x(lineX).on('brush', _brushed);

		for(var countIndex = 0;countIndex < countArray.length;countIndex++){
			countArray[countIndex] = 0;
		}
		var timeData = _.filter(tree_node_list, function(d) {
			return !Array.isArray(d.values);
		});
		for(var i = 0;i < timeData.length;i++){
			var eachData = +timeData[i].flow;
			timeDataSum = timeDataSum + eachData;
		}
		var count = 0;
		var sumCount = 0;
		var data = tree_node_list;
		for(var i = 0; i < timeData.length; i++){
			var d = timeData[i];
			dataSizeArray[i] = + d.flow;
			originalDataSizeArray[i] = + d.flow;
			if(dataSizeArray[i] != 0){
				dataSizeArray[i] = Math.round(Math.log(dataSizeArray[i]) * multi);
			}
		}
		var maxLogData = d3.max(dataSizeArray);
		for(var i = 0;i <= maxLogData;i++){
			countArray[i] = 0;
			eachTypeIdArray[i] = new Array();
			eachTypeIndexArray[i] = new Array();
		}
		for(var i = 0;i < dataSizeArray.length;i++){
			countArray[dataSizeArray[i]]++;
			eachTypeIdArray[dataSizeArray[i]].push(timeData[i].id);
			eachTypeIndexArray[dataSizeArray[i]].push(i);
		}
		var sumNode = 0;
		for(var i = 0;i < countArray.length;i++){
			sumNode = sumNode + countArray[i];
		}
		for(var i = 0;i < countArray.length;i++){
			if(countArray[i] != 0 ){
				countArray[i] = Math.log(countArray[i] + 1);
			}
		}
		lineX.range([0,width])
		.domain([0,(d3.max(dataSizeArray) + 1)/multi]);

		var xAxis = d3.svg.axis()
		.scale(lineX)
		.orient("bottom");

		//brush.x(lineX)
		//.on("brushend",_brushed);

		for(var i = 0;i < (d3.max(dataSizeArray)+1)/multi;i = i + 2){
			xAxisTicks.push(i);
		}
		var his_gap = width / (d3.max(dataSizeArray) + 1);
		var his_width = his_gap / 2;
		
		xAxis.tickValues(xAxisTicks);
		lineY.domain(d3.extent(countArray));
		for(var i = 0;i < countArray.length;i++){
			objArray[i] = new Object();
			objArray[i].num = i;
			objArray[i].count = countArray[i];
		}
		var yAxis = d3.svg.axis()
			.scale(lineY)
			.orient("left");
		var line = d3.svg.line()
			.x(function(d){return (lineX(d.num));})
			.y(function(d){return (lineY(d.count));})

		var radialHistogramSvg = d3.select("#radial-histogram-svg");
		radialHistogramSvg.selectAll('*').remove();

		var radialhistogram = radialHistogramSvg.selectAll(".his")
			.data(objArray)
			.enter()
			.append("rect")
			.attr("id",function(d,i){
				return "his" + i; 
			})
			.attr("class","his")
			.attr("width",function(d,i){
				return his_width;
			})
			.attr("height",function(d,i){
				return height - lineY(objArray[i].count);
			})
			.attr("x",function(d,i){
				return his_gap * i;
				//return lineX(i);
			})
			.attr("y",function(d,i){
				return lineY(objArray[i].count); 
			})
			.attr("fill","#C0C0C0");
		//if($("#radialcheckbox").attr("mark") == 2)
		//	radialhistogram.attr("fill","#FF7F0E");
		d3.select("#radial-histogram-svg")
		.append("g")
		.attr("class","y axis")
		.call(yAxis)
		.append("text")
		.attr("transform","rotate(-90)")
		.attr("class","label")
		.attr("x",5)
		.attr("y",16)
		.style("text-anchor","end")
		.text("log(Number)");

		d3.select("#radial-histogram-svg")
		.append("g")
		.attr("class","x axis")
		.attr("transform","translate(" + 0 + ","+ (height) +")")
		.call(xAxis)
		.append("text")
		.attr("class","label")
		.attr("x",width)
		.attr('y', 25)
		.style("text-anchor","end")
		.text("log(bytes)");

		d3.select("#radial-histogram-svg")
		.append("g")
		.attr("class","x brush")
		.call(brush)
		.selectAll("rect")
		.attr("y",0)
		.attr("height",height);
		if(dataCenter.global_variable.current_bg_color == 'white'){
			$('.axis path').css('stroke', '#000');
		}else{
			$('.axis path').css('stroke', '#fff');
		}
		function _brushed() {
			var radialHistogramSvg = d3.select("#radial-histogram-svg");
		  	var extentX = +radialHistogramSvg.select(".extent").attr("x");
		  	var extentWidth = +radialHistogramSvg.select(".extent").attr("width");
		    if(extentWidth > his_gap/3){
		  	  var beginIndexX = Math.floor(extentX / his_gap);
			  var includeNum = Math.round(extentWidth / his_gap);
			  radialHistogramSvg.selectAll(".his").classed("highlight", false)
			  for(var i = 0;i <= includeNum;i++){
			  	radialHistogramSvg.select("#his" + (beginIndexX + i)).classed("highlight", true);
			  }
			  AllIndexArray = new Array();
			  AllArray = new Array();
			  for(var i = 0;i <= includeNum;i++){
			  	AllIndexArray = AllIndexArray.concat(eachTypeIndexArray[beginIndexX + i]);
			  	AllArray = AllArray.concat(eachTypeIdArray[beginIndexX + i]);
			  }
			  AllArray = _.uniq(AllArray);
			  AllIndexArray = _.uniq(AllIndexArray);
			  var sum = 0;
			  for(var i=0;i<AllIndexArray.length;i++){
			  	if(AllIndexArray[i] < timeData.length){
			  		sum = sum + timeData[AllIndexArray[i]].values;
			  	}
			  }
			  var percentage = sum/timeDataSum;
			  ObserverManager.post("percentage",percentage);
			  ObserverManager.post("highlight", _.uniq(AllArray))
			  lineX.domain(brush.empty() ? lineX.domain() : brush.extent());
			}else{
				radialHistogramSvg.selectAll(".his").classed("highlight", false)
			  	ObserverManager.post("percentage", 0);
				ObserverManager.post("highlight", [])
				lineX.domain(brush.empty() ? lineX.domain() : brush.extent());
			}
		}
	},
	OMListen: function(message, data){
		var self = this;
		var svg = d3.select("svg.radial-histogram");
		if(message == 'set:tree_node_list'){
			self._render_view();
		}
		if(message == 'clean-view'){
			svg.selectAll('*').remove();
		}
		if(message == 'draw-current-operation'){
			self._render_view();
		}
	}
}