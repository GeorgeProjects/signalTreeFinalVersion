var toolbarSignaltree = {
	name:'tool-bar-signal-tree',
	initialize: function(){
		var self = this;
		self._add_to_listeners();
		self._bind_view();
		return this;
	},
	_add_to_listeners: function(){
		//dataCenter.set_global_variable('activeA', 3);
		ObserverManager.addListener(this);
	},
	//var toolbarSignaltreeObj: this, 
	//toolbarSignaltreeObj._bind_view();
	//selection of the subburst and radial tree
	_bind_view: function(){
		$('#sunburst-tree').on('click', function(d,i){
			if(!($('#sunburst-tree').hasClass('active'))){
				$('#sunburst-tree').addClass('active');
				$('#radial-tree').removeClass('active');
				if(dataCenter.global_variable.treeview_or_projection == 'treeview'){
					document.getElementById("leftTopLeftWrapper-sunburst").style.visibility= "visible" ;
					document.getElementById("leftTopLeftWrapper-radial").style.visibility= "hidden" ;
				}
				dataCenter.set_global_variable('sunburst_or_radial', 'sunburst');
			}
		});
		$('#radial-tree').on('click', function(d,i){
			if(!($('#radial-tree').hasClass('active'))){
				$('#radial-tree').addClass('active');
				$('#sunburst-tree').removeClass('active');
				if(dataCenter.global_variable.treeview_or_projection == 'treeview'){
					document.getElementById("leftTopLeftWrapper-sunburst").style.visibility= "hidden" ;
					document.getElementById("leftTopLeftWrapper-radial").style.visibility= "visible" ;
				}
				dataCenter.set_global_variable('sunburst_or_radial', 'radial');
			}
		});
		//--------------
		//multi group button
		//选择在投影界面上面的显示选项，显示树形结构，或者带glyph的projection
		$('.projection-method').on('click', function(d,i){
			var thisId = $(this).attr('id');
			if(!($(this).hasClass('active'))){
				$('.projection-method').removeClass('active');
				$(this).addClass('active');
				if(thisId == "tree-view"){
					document.getElementById("leftTreeWrapper").style.visibility= "visible" ;
					document.getElementById("projectionWrapper").style.visibility= "hidden" ;
					document.getElementById("projectionLinkWrapper").style.visibility= "hidden" ;
					if(dataCenter.global_variable.sunburst_or_radial == 'radial'){
						document.getElementById("leftTopLeftWrapper-sunburst").style.visibility= "hidden" ;
						document.getElementById("leftTopLeftWrapper-radial").style.visibility= "visible" ;
					}else{
						document.getElementById("leftTopLeftWrapper-sunburst").style.visibility= "visible" ;
						document.getElementById("leftTopLeftWrapper-radial").style.visibility= "hidden" ;
					}
					dataCenter.set_global_variable('treeview_or_projection', 'treeview');
					document.getElementById('histogram-label-text').style.visibility = 'visible';
				}else{
					//全部隐藏div中的信息
					document.getElementById("leftTreeWrapper").style.visibility= "hidden" ;
					document.getElementById("projectionWrapper").style.visibility= "hidden" ;
					document.getElementById("projectionLinkWrapper").style.visibility= "hidden" ;
					document.getElementById("leftTopLeftWrapper-sunburst").style.visibility= "hidden" ;
					document.getElementById("leftTopLeftWrapper-radial").style.visibility= "hidden" ;
					if(thisId == 'original-projection'){
						document.getElementById("projectionWrapper").style.visibility= "visible" ;
						//dataCenter.set_global_variable('projection_method', 'original-projection');
					}else if(thisId == 'center-projection'){
						document.getElementById("projectionLinkWrapper").style.visibility= "visible" ;
						//dataCenter.set_global_variable('projection_method', 'link-projection');
					}
					document.getElementById('histogram-label-text').style.visibility = 'visible';
					dataCenter.set_global_variable('treeview_or_projection', 'projection');
					document.getElementById('histogram-label-text').style.visibility = 'hidden';
				}
			}
		});
		return this;
	}
	//return toolbarSignaltreeObj;
}