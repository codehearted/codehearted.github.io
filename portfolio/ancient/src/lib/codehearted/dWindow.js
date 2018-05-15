/*
	Codehearted Window Manager
		Created on Sept. 6 by Paul Jacobs
	
	
	|Borrows from and builds upon several scripts
	|	from the IBS package by Ill Maestro. Original Code available at http://www.richardinfo.com/
*/


/* *********************************************************
** dWindow(id, x, y, w, h, caption)
** ===============================
** object constructor for a dynapi 2 dWindow widget object
**   id = id of widget
**   x = x coordinate (pixel) of widget's ulc
**   y = y coordinate of widget's ulc
**   w = width (pixels) of widget
**   h = height of widget
**   caption = text label of dWindow (html tags allowed)
********************************************************* */

function dWindow(id, x, y, w, h, caption, content, isResizable, backgroundImage, manager, index, style) {

  // create new instance of DynLayer object
  this.superClass = DynLayer;
  this.superClass(id, x, y, w, h);

  // set dWindow location, size, caption
  this.moveTo(x, y);
  this.setSize(w, h);
  this.caption = caption;
  this.content = content;
//  this.isResizable = isResizable;
  this.isResizable = false; // resizing doesn't work yet
  this.backgroundImage = (backgroundImage || 'images/boxtest29.jpg');
  this.previousResizePosition = new Array(2)
  this.savedContent = ""
  this.manager = manager
  this.index = index
  
  //this.style = this.setStyle(style,'png')

  // add eventlistener dWindow.listener to this dWindow widget
  this.addEventListener(dWindow.listener);

  return this;

}

// make dWindow widget a child-class of the DynLayer
dWindow.prototype = new DynLayer();


// Methods
dWindow.prototype.setResizable = function (resize) {
	if (this.isResizable=resize) {
			
		DragEvent.enableDragEvents(this.dynResizable)
	}
	else {
	 DragEvent.disableDragEvents(this.dynResizable)
	 this.dynResize.setVisible(false)
	 }
}
dWindow.prototype.getResizable = function() {return this.isResizable}


dWindow.prototype.moveToTop = function() {
	this.manager.moveToTop(this)
}


dWindow.prototype.clioFrameStyle = function(wide,high) {
	var middleHeight = high - 109;
	var middleWidthTop = wide - 257;
	var middleWidthMiddle = wide - 39;
	var middleWidthBottom = wide - 207;

return '<table width="'+wide+'" border="0" cellpadding="0" cellspacing="0"><tr><table  border="0" cellpadding="0" cellspacing="0"><tr height="53"><td><img src="images/panels-splitting_01.png" width="184" height="53"></td><td width="'+middleWidthTop+'"><img src="images/panels-splitting_02.png" width="'+middleWidthTop+'" height="53"></td><td><img src="images/panels-splitting_03.png" width="73" height="53"></td></tr></table></tr><tr><table height="'+middleHeight+'" border="0" cellpadding="0" cellspacing="0"><tr height="'+middleHeight+'"><td><img src="images/panels-splitting_04.png" width="19" height="'+middleHeight+'"></td><td><img src="images/panels-splitting_05.png" width="'+middleWidthMiddle+'" height="'+middleHeight+'"></td><td><img src="images/panels-splitting_06.png" width="20" height="'+middleHeight+'"></td></tr></table></tr><tr><table  border="0" cellpadding="0" cellspacing="0"><tr><td><img src="images/panels-splitting_07.png" width="28" height="56"></td><td><img src="images/panels-splitting_08.png" width="'+middleWidthBottom+'" height="56"></td><td><img src="images/panels-splitting_09.png" width="179" height="56"></td></tr></table></tr></table>'

}


dWindow.prototype.clioWindowFrameStyle = function(wide,high) {
	var middleHeight = high - 109;
	var middleWidthTop = wide - 257;
	var middleWidthMiddle = wide - 39;
	var middleWidthBottom = wide - 207;

return '<table width="'+wide+'" border="0" cellpadding="0" cellspacing="0"><tr><table  border="0" cellpadding="0" cellspacing="0"><tr height="53"><td><img src="images/panels-splitting_01.png" width="184" height="53"></td><td width="'+middleWidthTop+'"><img src="images/panels-splitting_02.png" width="'+middleWidthTop+'" height="53"></td><td><img src="images/panels-splitting_03.png" width="73" height="53"></td></tr></table></tr><tr><table height="'+middleHeight+'" border="0" cellpadding="0" cellspacing="0"><tr height="'+middleHeight+'"><td><img src="images/panels-splitting_04.png" width="19" height="'+middleHeight+'"></td><td><img src="images/panels-splitting_05.png" width="'+middleWidthMiddle+'" height="'+middleHeight+'"></td><td><img src="images/panels-splitting_06.png" width="20" height="'+middleHeight+'"></td></tr></table></tr><tr><table  border="0" cellpadding="0" cellspacing="0"><tr><td><img src="images/panels-splitting_07.png" width="28" height="56"></td><td><img src="images/panels-splitting_08.png" width="'+middleWidthBottom+'" height="56"></td><td><img src="images/panels-splitting_09.png" width="179" height="56"></td></tr></table></tr></table>'

}





dWindow.prototype.img = function(src,width,height) {
	return '<img  src="'+src+'" width="'+width+'" height="'+height+'" border="0"></img>'
}

/* *********************************************************
** dWindow.listener.onprecreate()
** =============================
** onprecreate event handler for dWindow widget
**   executes just before dWindow is added to parent object
**   it's here where we actually build the widget
********************************************************* */

// first create eventlistener object for dWindow widget
dWindow.listener = new EventListener();

dWindow.listener.onprecreate = function(e) {

  var o = e.getSource();    // o = this dWindow object


	o.graphics = new Array()
	o.graphics['closebox'] = '<img  src="images/closebox-white-blue.gif" width="19" height="19" border="0"></img>'
	o.graphics['closebox-light'] = '<img  src="images/close-box-light.gif" width="19" height="19" border="0"></img>'
	o.graphics['resizebox'] = '<img  src="images/closebox-white-blue.gif" width="38" height="19" border="0"></img>'
	

  

  
          // create bg dynlayer
  	o.dynbg = new DynLayer(null, 7, 28, o.w-18, o.h-63);  // 306 x 188
	o.dynbg.setHTML(o.img(o.backgroundImage,o.dynbg.w,o.dynbg.h));
	o.addChild(o.dynbg);

//  /* //
  
    // create child dynlayer for frame
  o.dynframe = new DynLayer(null, 0, 0, o.w, o.h);  // center it
  o.dynframe.setHTML(o.clioFrameStyle(o.w,o.h));
  o.addChild(o.dynframe);

// */ //

  
      // create child dynlayer for overlays / widgets
      
  o.dynOverlay = new DynLayer(null, 7, 3, o.w-18, 20);       
  o.dynOverlay.setHTML('<TABLE width="100%" height="20" border="0" cellpading="0" cellspacing="0" style="font-weight: bold"><TR align="center"><td align=left><font face="verdana" size="3"  color="#bbbbbb" >'+o.caption+'</font></td><TD align="right"></TD></TR></TABLE>');
  o.addChild(o.dynOverlay);


  // create child dynlayer for close box
  		o.dynWidgets = new DynLayer('closebox', o.w-30, 5, 20, 20); 
  		o.dynWidgets.setHTML(o.graphics['closebox']);
  		//o.dynWidgets.setHTML(o.graphics['closebox-light']);
  		o.dynWidgets.listener = new EventListener(o.dynWidgets)
	  		// define events here
  			o.dynWidgets.listener.onmouseup = function(e) {
  				var tgt = e.getTarget()
  				if (tgt.id == 'closebox') {
  					o.invokeEvent("close")
  				}
  			}
  		o.dynWidgets.addEventListener(o.dynWidgets.listener);
  o.addChild(o.dynWidgets);


	  
 
         // create content dynlayer
  	o.dyncontent = new DynLayer("content", 7, 28, o.w-18, o.h-63, null, true, o.z + 10);
  	o.content = '<table class="content" width="'+o.dyncontent.w+'" height="'+o.dyncontent.h+'"  border="0"><tr align="center" valign="middle"><td>'+o.content+'</td></tr></table>'

	
	o.dyncontent.setHTML(o.content);
  	
  		o.dyncontent.listener = new EventListener(o.dyncontent)
	  		// define events here

  			o.dyncontent.listener.onmouseover = function(e) {
				  DragEvent.disableDragEvents(e.getTarget().parent)
				  
  			}

  			o.dyncontent.listener.onmousedown = function(e) {
				  e.getTarget().parent.moveToTop();
  			}

  			o.dyncontent.listener.onmouseout = function(e) {
				  DragEvent.enableDragEvents(e.getTarget().parent)
  			}
  			

  		o.dyncontent.addEventListener(o.dyncontent.listener);

	o.addChild(o.dyncontent);


  

  // 						layer 	top 	right 				bottom 				left
  DragEvent.setDragBoundary(o,		70,	o.parent.w,			o.parent.h,			117)
  DragEvent.enableDragEvents(o)
  
            
  // make sure the dWindow is visible
  o.setVisible(true);

}


dWindow.listener.onclose = function(e) {
	var tgt = e.getSource();
	tgt.del()
}


dWindow.listener.ondragstart = function(e) {
	var tgt = e.getSource();
 		
		tgt.moveToTop()
	return true
}

dWindow.listener.ondragend = function(e) {
	var tgt = e.getSource();
	return true
}


dWindow.listener.onuserResize = function(e) {
	var tgt = e.getSource();
	alert("tgt width="+tgt.w)
}
