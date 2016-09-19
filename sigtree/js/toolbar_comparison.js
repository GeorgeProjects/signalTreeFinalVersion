var toolbarComparison = {
	name: 'toolbar-comparison',
	initialize: function(){
		var self = this;
		self._add_to_listeners();
		self._bind_view();
		return this;
	},
	_add_to_listeners: function(){
		ObserverManager.addListener(this);
	},	
	_bind_view: function(){
		//multi group button
		$('.level-selection').on('click', function(d,i){
			$('.level-selection').removeClass('active');
			var depth = +$(this).attr('id').replace('level-','');
			for(var _i = 0;_i <= depth;_i++){
				$('#level-' + _i).addClass('active');
			}
			ObserverManager.post('change-depth', depth);
		});
		//--------------
		//group button
		$('#all-node-comparison').on('click', function(d,i){
			if(!($('#all-node-comparison').hasClass('active'))){
				$('#all-node-comparison').addClass('active');
				$('#same-node-comparison').removeClass('active');
				ObserverManager.post('show-all');
			}
		});
		$('#same-node-comparison').on('click', function(d,i){
			if(!($('#same-node-comparison').hasClass('active'))){
				$('#same-node-comparison').addClass('active');
				$('#all-node-comparison').removeClass('active');
				ObserverManager.post('show-similiar');
			}
		});
		$('#all-depth-comparison').on('click', function(d,i){
			if(!$('#all-depth-comparison').hasClass('active')){
				$('#all-depth-comparison').addClass('active');
				$('#two-depth-comparison').removeClass('active');
				$('#only-flow-comparison').removeClass('active');
				$('#shortest-flow-comparison').removeClass('active');
			}
			ObserverManager.post('comparison-show-all-depth');
		});
		$('#two-depth-comparison').on('click', function(d,i){
			if(!$('#two-depth-comparison').hasClass('active')){
				$('#two-depth-comparison').addClass('active');
				$('#all-depth-comparison').removeClass('active');
				$('#only-flow-comparison').removeClass('active');
				$('#shortest-flow-comparison').removeClass('active');
			}
			ObserverManager.post('comparison-show-two-depth');
		});
		$('#only-flow-comparison').on('click', function(d,i){
			if(!$('#only-flow-comparison').hasClass('active')){
				$('#only-flow-comparison').addClass('active');
				$('#two-depth-comparison').removeClass('active');
				$('#all-depth-comparison').removeClass('active');
				$('#shortest-flow-comparison').removeClass('active');
			}
			ObserverManager.post('comparison-show-only-flow');
		});
		$('#shortest-flow-comparison').on('click', function(d,i){
			if(!$('#shortest-flow-comparison').hasClass('active')){
				$('#shortest-flow-comparison').addClass('active');
				$('#two-depth-comparison').removeClass('active');
				$('#all-depth-comparison').removeClass('active');
				$('#only-flow-comparison').removeClass('active');
			}
			ObserverManager.post('show-shortest-flow');
		});
		$('#resize-brush').on('click', function(d,i){
			if(!$('#resize-brush').hasClass('active')){
				$('#resize-brush').addClass('active');
			}
			ObserverManager.post('resize-brush');
		});
	}
}