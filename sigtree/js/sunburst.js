/**
 *  存在的问题：
 *  1. the tooptip should hide when mouseout
 *  2. highlight the the node and its children nodes
 *  3. set the global variable mouse_over_signal_node when mouseover nodes(to set the text in the selection view)
 * @type {Object}
 */
var sunburst = {
    name: 'sunburst',
    initialize: function(){
        var self = this;
        self._add_to_listener();
        self._bind_view();
        var treeRoot = dataCenter.datasets[0].processor.result.treeRoot;
        self._render_view(treeRoot);
        return self;
    },
    _add_to_listener: function(){
        var self = this;
        ObserverManager.addListener(self);
    },
    _bind_view: function(){
    },
    _render_view: function(tree_root){
        var self = this;
        var padding = 10;
        var divID = "leftTopLeftWrapper-sunburst";
        var div = d3.select("#"+divID);
        var width = $("#leftTopLeftWrapper-sunburst").width() - padding * 2;
        var height = $("#leftTopLeftWrapper-sunburst").height() - padding * 2;
        var depth = 4;
        var sunburst_outer = d3_sunburst()
            .drawn_depth(depth)
            .width(width)
            .height(height)
            .radius( (d3.min([width,height])/2)*1 )
            .cal_innerRadius(function(totalradius,depth){
                return totalradius/4*(depth-1)*0.92+totalradius*0.08;
            })
            .group_id("outer_sunburst")
        if (div.select("svg")[0][0]===null)
        {
            div.append("svg")
        }
        var svg = div.select("svg")
                .style("position","absolute")
                .style("width",width)
                .style("height",height) 
                .style('left', padding) 
                .datum(tree_root)
                .call(sunburst_outer)
    },
    OMListen: function(message, data){
        if(message == "update-view"){
            var self = this;
            var currentId = dataCenter.global_variable.current_id;
            for(var i = 0;i < dataCenter.datasets.length;i++){
                if(currentId == dataCenter.datasets[i].id){
                    var tree_root = dataCenter.datasets[i].processor.result.treeRoot;
                    self._render_view(tree_root);
                    break;
                }
            }
        }
    }
}
	function d3_sunburst()
    {
        var width = 800,
            height = 800,
            radius = d3.min([width,height])/2,
            drawn_depth = 1000000,
            cal_innerRadius = function(totalradius,depth)
            {
                return totalradius/5*depth*0.7+totalradius*0.3;
            },
            group_id = undefined;
            
        function chart(selection)
        {
            selection.each(function(tree_data) 
            {
            	function _id_to_name(id)
            	{
            		var temp = id.split("-");
            		return temp[temp.length-1];
            	}

                var svg = d3.select(this)
                if (svg.select("g")[0][0]===null)
                {
                    svg.append("g")
                        .attr("id",group_id)
                        .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
                }
                svg = svg.select("g")
                
                function filter_min_arc_size_text(d, i) {
                	var angle_flag = (d.dx*cal_innerRadius(radius,d.depth))>14;
                	var length_flag = _id_to_name(d.id).length <= 4;
                	return angle_flag && length_flag;
                }; 
                
                var partition = d3.layout.partition()
                    .sort(function(a, b) { return d3.ascending(a.id, b.id); })
                    .size([2 * Math.PI, radius]);//决定最后的layout的角度大小与半径

                var arc = d3.svg.arc()
                    .startAngle(function(d) { return d.x; })
                    .endAngle(function(d) { 
                    	if (d.dx - .03 / (d.depth + .5)>0.002)
                    		return d.x + d.dx - .03 / (d.depth + .5); 
                    	return d.x+0.002
                    })
                    //.endAngle(function(d) { return d.x + d.dx - .01 / (d.depth + .5); })
                    .innerRadius(function(d) { return cal_innerRadius(radius,d.depth); })
                    .outerRadius(function(d) { return cal_innerRadius(radius,d.depth+1) - 2; });      

                //控制每块弧上的文字的角度，使得文字在radial的layout中能够散开
                function computeTextRotation(d) {
                    var angle=(d.x +d.dx/2)*180/Math.PI - 90
                    return angle;
                }

                //鼠标移动到arc上的交互
                function mouseOverArc(d,this_ele) 
                {
                    d3.selectAll(".sunburst_arc").classed("mouseover_hide-sunburst_arc",true);
                    d3.select(this_ele).classed("mouseover_hide-sunburst_arc",false);
                    var parent = d.parent;
                    while (true)
                    {
                        if (typeof(parent)=="undefined")
                            break;
                        d3.select("#"+parent.id).classed("mouseover_hide-sunburst_arc",false);
                        parent = parent.parent;
                    }

                    _communicate()
                    function _communicate(){
                        var this_node = d3.select(this_ele);
                        ObserverManager.post("mouse-over", [d.id]);
                        dataCenter.set_global_variable('mouse_over_signal_node', this_node);
                    }
                }

                function mouseOutArc(d){
                    d3.selectAll(".sunburst_arc")
                        .classed("mouseover_hide-sunburst_arc",false)

                    _communicate()
                    function _communicate(){
                        ObserverManager.post("mouse-out", [d.id]);
                        //tip.hide(d);
                    }
                }

                function mouseMoveArc (d) {

                }

                partition
                    .value(function(d) { return d.value; })
                    .nodes(tree_data)//绑定数据

                // Now redefine the value function to use the previously-computed sum.
                partition
                    .children(function(d, depth) { return depth < drawn_depth ? d.children : null; })//使用的数据的树的最大深度
                    .value(function(d) { return d.flow; });

                 
                var center = svg.append("circle")//中心用于跳出的圆
                    .attr("class","zoomout_circle")
                    .attr("r", cal_innerRadius(radius,1))
                    .on("click", zoomOut);
             
                var partitioned_data = partition.nodes(tree_data).slice(1)

                //弧的属性控制
                var path = svg.selectAll("path")
                        .data(partitioned_data,function(d,i){return d.id})
                path.enter().append("path")
                    .attr("d", arc)
                    .attr("class","sunburst_arc")
                    .attr("id",function(d){return d.id})//按照节点在树中的位置唯一标记每一个node的arc
                    .style("fill", function(d) { return fill(d); })//载入时的sunburst的着色
                    .each(function(d) { this._current = updateArc(d); })
                    .on("mouseover", function(d,i){mouseOverArc(d,this);})
                    .on("mousemove", mouseMoveArc)
                    .on("mouseout", mouseOutArc)
                    .on("click", zoomIn);

                path.exit().transition()
                    .style("fill-opacity", function(d) { return 0; })
                    .remove();       

                path.transition()
                    .style("fill-opacity", 1)
                    .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });    
                  
                var texts = svg.selectAll("text")
                                .data(partitioned_data,function(d,i){return d.id})
                texts.enter().append("text")
                                .filter(filter_min_arc_size_text)       
                                .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
                                .attr("x", function(d) { return cal_innerRadius(radius,d.depth); })     
                                .attr("dx", "6") // margin
                                .attr("dy", ".35em") // vertical-align    
                                .text(function(d,i) {return _id_to_name(d.id)})
                texts.exit().remove()      
                
                //如果p不是root下面的第一层结点，那么调用zoom in(p)是进入结点p的父
                //如果p是root下面的第一层结点，那么调用zoom in(p)是进入结点p               
                function zoomIn(p) 
                {
                    if (p.depth > 1) p = p.parent;
                    if (!p.children) return;
                    zoom(p, p);
                }
                
                function zoomOut(p) 
                {
                    if (!p.parent) return;
                    zoom(p.parent, p);
                }
            
                // Zoom to the specified new root.
                function zoom(root, p) 
                {
                    // Rescale outside angles to match the new layout.
                    var enterArc,
                        exitArc,
                        outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

                    function insideArc(d) {
                        return p.id > d.id
                            ? {depth: d.depth - 1, x: 0, dx: 0} : p.id < d.id
                            ? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
                            : {depth: 0, x: 0, dx: 2 * Math.PI};
                    }

                    function outsideArc(d) {
                        return {depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)};
                    }

                    center.datum(root);

                    // When zoom ing in, arcs enter from the outside and exit to the inside.
                    // Entering outside arcs start from the old layout.
                    if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);
                    
                    var new_data=partition.nodes(root).slice(1)

                    path = path.data(new_data, function(d) { return d.id; });
                         
                    // When zoom ing out, arcs enter from the inside and exit to the outside.
                    // Exiting outside arcs transition to the new layout.
                    if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

                    //按alt键时变化的持续时间变成7500ms
                    d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function(){
                        path.exit().transition()
                            .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
                            .attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
                            .remove();
                          
                        path.enter().append("path")
                            .attr("class","sunburst_arc")
                            .attr("id",function(d){return d.id})//按照节点在树中的位置唯一标记每一个node的arc
                            .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
                            .style("fill", function(d) { return fill(d); })
                            .on("click", zoomIn)
                            .on("mouseover", function(d,i){mouseOverArc(d,this);})
                            .on("mousemove", mouseMoveArc)
                            .on("mouseout", mouseOutArc)
                            .each(function(d) { this._current = enterArc(d); });

                        path.transition()
                            .style("fill-opacity", 1)
                            .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
                    });
                    
                    texts = texts.data(new_data, function(d) { return d.id; })
                     
                    texts.exit()
                        .remove()    
                    texts.enter()
                        .append("text")
                    texts.style("opacity", 0)
                        .attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
                        .attr("x", function(d) { return cal_innerRadius(radius,d.depth); }) 
                        .attr("dx", "6") // margin
                        .attr("dy", ".35em") // vertical-align
                        .filter(filter_min_arc_size_text)     
                        .text(function(d,i) {return _id_to_name(d.id)})
                        .transition().delay(750).style("opacity", 1)
                }

                function fill(d) 
                {
                    var cur_color = "steelblue"
                    var c = d3.lab(cur_color)

                    //数值越大，颜色越深
                    var luminance = d3.scale.linear()//.sqrt()//配色的亮度
                        .domain([0, 1])//定义域
                        .clamp(true)
                        .range([110, 70]);//值域

                    c.l=luminance(d.flow)
                    return c;
                }

                function arcTween(b) {
                    var i = d3.interpolate(this._current, b);
                    this._current = i(0);
                    return function(t) {
                        return arc(i(t));
                    };
                }

                function updateArc(d) {
                    return {depth: d.depth, x: d.x, dx: d.dx};
                }
            });
        }

        chart.group_id = function(value)
        {
            if (!arguments.length) return group_id;
            if (typeof(value)!="string")
            {
                console.warn("invalid value for group_id",value);
                return;
            }
            group_id = value;
            return chart;
        };

        chart.width = function(value)
        {
            if (!arguments.length) return width;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for width",value);
                return;
            }
            width = value;
            return chart;
        };

        chart.height = function(value)
        {
            if (!arguments.length) return height;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for height",value);
                return;
            }
            height = value;
            return chart;
        };

        chart.radius = function(value)
        {
            if (!arguments.length) return radius;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for radius",value);
                return;
            }
            radius = value;
            return chart;
        };

        chart.drawn_depth = function(value)
        {
            if (!arguments.length) return drawn_depth;
            if (typeof(value)!="number")
            {
                console.warn("invalid value for drawn_depth",value);
                return;
            }
            drawn_depth = value;
            return chart;
        };

        chart.cal_innerRadius = function(value)
        {
            if (!arguments.length) return cal_innerRadius;
            if (typeof(value)!="function")
            {
                console.warn("invalid value for cal_innerRadius",value);
                return;
            }
            cal_innerRadius = value;
            return chart;
        };

        return chart;
    }
