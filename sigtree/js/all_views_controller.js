var allViewController = {
	name: 'all_view_controller',
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
	},
	_black_handler: function(){
		$('body').css('background-color', '#333');
		$('body').css('color', 'white');
		$('body').css('fill', 'white');
		$('.domain').css('stroke', 'white');
		$('.arc-path').css('stroke','white');
		$('.append-current-circle').css('fill', 'white');
		$('.append-current-circle').css('stroke', 'white');
		$('.tick line').css('stroke', 'white');
		$('.button-group div').css('color', 'white');
		$('.button-group.bind div').css('color', 'white');
		$('.structure').css('border-color','black');
		$('.dimension line').css('stroke', 'white');
		$('#divide-line').css('border-top', '1px solid black');
		$('.comparison-signaltree-div').removeClass('white-border');
		$('.comparison-signaltree-div').addClass('black-border');
		$('table.label-table').css('border-right','1px solid black');
		$('#change-color-white').html('<i class="icon iconfont">&#xe600;</i>');
		$('#change-color-black').html('<i class="icon iconfont">&#xe613;</i>');
		//$('#click-change-background #change-color-black .icon iconfont').empty();		
		return;
	},
	_white_handler: function(){
		$('body').css('background-color', 'white');
		$('body').css('color', 'black');
		$('body').css('fill', 'black');
		$('.domain').css('stroke', 'black');
		$('.arc-path').css('stroke','black');
		$('.append-current-circle').css('fill', 'black');
		$('.append-current-circle').css('stroke', 'black');
		$('.tick line').css('stroke', 'black');
		$('.button-group div').css('color', '#bbbbbb');
		$('.button-group.bind div').css('color', 'black');
		$('.structure').css('border-color','#a0a0a0');
		$('.dimension line').css('stroke', 'black');
		$('.comparison-signaltree-div').removeClass('black-border');
		$('.comparison-signaltree-div').addClass('white-border');
		$('table.label-table').css('border-right','1px solid #a0a0a0');
		$('#change-color-white').html('<i class="icon iconfont">&#xe613;</i>');
		$('#change-color-black').html('<i class="icon iconfont">&#xe600;</i>');
		//$('#click-change-background #change-color-white .icon iconfont').empty();
		//$('#click-change-background #change-color-black .icon iconfont').empty();	
		return;
	},
	_chinese_handler: function(){
		$('#title').attr('title', '关于本系统');
		$('#arc-link').attr('title', '全部显示连接');
		$('#arc-link-hover').attr('title', '鼠标悬停显示连接');
		$('#time-sort').attr('title', '按时间排序');
		$('#size-sort').attr('title', '按流量大小排序');
		$('#switch-selection').attr('title', '变换选择');
		$('#click-node-shrink').attr('title', '收缩选择节点');
		$('#click-other-node-shrink').attr('title', '收缩兄弟节点');
		$('#clear-all').attr('title', '清空');
		$('#load-file-name').attr('title', '加载文件');

		$('#change-color-white').attr('title', '白色背景');
		$('#change-color-black').attr('title', '黑色背景');
		$('#change-language-chinese').attr('title', '中文');
		$('#change-language-english').attr('title', '英文');

		$('#comparison-title').attr('title', '多树比较视图');
		$('#all-node-comparison').attr('title', '比较全部节点');
		$('#same-node-comparison').attr('title', '比较相同节点');
		$('#all-depth-comparison').attr('title', '显示全部层级');
		$('#two-depth-comparison').attr('title', '显示最后两层');
		$('#only-flow-comparison').attr('title', '显示流量大小');
		$('#shortest-flow-comparison').attr('title', '动态调整高度');
		$('#level-0').attr('title', '第1层');
		$('#level-1').attr('title', '第2层');
		$('#level-2').attr('title', '第3层');
		$('#level-3').attr('title', '第4层');
		$('#level-4').attr('title', '第5层');

		$('#single-tree-title').attr('title', '单树视图');
		$('#radial-tree').attr('title', 'radial');
		$('#sunburst-tree').attr('title', 'sunburst');
		$('#tree-view').attr('title', '树结构可视化');
		$('#original-projection').attr('title', '投影视图');
		$('#center-projection').attr('title', '链接投影视图');
		$('#center-size-glyph').attr('title', '大小编码投影视图');
		$('#center-subgraph-glyph').attr('title', '子图编码投影视图');
		$('#center-sunburst-glyph').attr('title', 'sunburst编码投影视图');

		$('#system-title-div #title').html('信号树可视化系统');
		$('#comparison-title-div #title').html('多树比较视图');
		$('#singletree-title-div #title').html('单树视图');
		$('#label-A .date_label').html('<strong>日期:</strong>');
		$('#label-A .value_label').html('<strong>数值:</strong>');
		$('#label-A .level_label').html('<strong>层级:</strong>');
		$('#label-A .node_num_label').html('<strong>节点数量:</strong>');

		$('#label-C #node-label').html('<strong>节点名称:</strong>');
		$('#label-C #level-label').html('<strong>层级:</strong>');
		$('#label-C #flow-num-label').html('<strong>流量大小:</strong>');
		$('#label-C #tree-num-label').html('<strong>编号:</strong>');
		$('#label-C #sub-node-label').html('<strong>子节点数量:</strong>');
		$('#histogram-label-text').html('流量分布柱状图');
		$('.button').tooltip(); 
	},
	_english_handler: function(){
		$('#title').attr('title', 'about this system');
		$('#arc-link').attr('title', 'draw the whole arc links');
		$('#arc-link-hover').attr('title', 'draw the arc links when hover');
		$('#time-sort').attr('title', 'sorting according to time');
		$('#size-sort').attr('title', 'sorting according to flow size');
		$('#switch-selection').attr('title', 'switch the selection');
		$('#click-node-shrink').attr('title', 'shrink the click node');
		$('#click-other-node-shrink').attr('title', 'shrink the sibling nodes');
		$('#clear-all').attr('title', 'clear');
		$('#load-file-name').attr('title', 'load file');

		$('#change-color-white').attr('title', 'white background');
		$('#change-color-black').attr('title', 'black background');
		$('#change-language-chinese').attr('title', 'Chinese');
		$('#change-language-english').attr('title', 'English');

		$('#comparison-title').attr('title', 'multi-tree comparison');
		$('#all-node-comparison').attr('title', 'compare all the nodes');
		$('#same-node-comparison').attr('title', 'compare the same nodes');
		$('#all-depth-comparison').attr('title', 'compare the whole levels');
		$('#two-depth-comparison').attr('title', 'compare the last two levels');
		$('#only-flow-comparison').attr('title', 'compare the last level(flow size)');
		$('#shortest-flow-comparison').attr('title', 'switch the selection');
		$('#level-0').attr('title', 'first-level');
		$('#level-1').attr('title', 'second-level');
		$('#level-2').attr('title', 'third-level');
		$('#level-3').attr('title', 'forth-level');
		$('#level-4').attr('title', 'fifth-level');

		$('#single-tree-title').attr('title', 'single tree visualization');
		$('#radial-tree').attr('title', 'radial');
		$('#sunburst-tree').attr('title', 'sunburst');
		$('#tree-view').attr('title', 'tree view');
		$('#original-projection').attr('title', 'original projection view');
		$('#center-projection').attr('title', 'linked projection view');
		$('#center-size-glyph').attr('title', 'sized projection view');
		$('#center-subgraph-glyph').attr('title', 'subgraph projection view');
		$('#center-sunburst-glyph').attr('title', 'sunburst projection view');

		$('#system-title-div #title').html('SignalTree Visualization System');
		$('#comparison-title-div #title').html('Multi-tree Comparison View');
		$('#singletree-title-div #title').html('SignalTree View');
		$('#label-A .date_label').html('<strong>Date:</strong>');
		$('#label-A .value_label').html('<strong>Values:</strong>');
		$('#label-A .level_label').html('<strong>Level:</strong>');
		$('#label-A .node_num_label').html('<strong>Node Num:</strong>');

		$('#label-C #node-label').html('<strong>Node:</strong>');
		$('#label-C #level-label').html('<strong>Level:</strong>');
		$('#label-C #flow-num-label').html('<strong>FlowNum:</strong>');
		$('#label-C #tree-num-label').html('<strong>TreeNum:</strong>');
		$('#label-C #sub-node-label').html('<strong>SubNode:</strong>');
		$('#histogram-label-text').html('Flow Distribution');
		$('.button').tooltip(); 
	},
	OMListen: function(message, data){
		var self = this;
		if(message == 'set:current_bg_color'){
	    	if(dataCenter.global_variable.current_bg_color == 'black'){
	    		$('#change-color-black').addClass('active');
	    		$('#change-color-white').removeClass('active');
	    		self._black_handler();
	    	}else{
	    		$('#change-color-white').addClass('active');
	    		$('#change-color-black').removeClass('active');
	    		self._white_handler();
	    	}
	    }
	    if(message == 'set:current_bg_language'){
	    	if(dataCenter.global_variable.current_bg_language == 'chinese'){
	    		$('#change-language-chinese').addClass('active');
	    		$('#change-language-english').removeClass('active');
	    		self._chinese_handler();
	    	}else{
	    		$('#change-language-english').addClass('active');
	    		$('#change-language-chinese').removeClass('active');
	    		self._english_handler();
	    	}
	    }
	}
}