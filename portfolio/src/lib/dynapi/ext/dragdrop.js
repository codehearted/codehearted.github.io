/*
   DynAPI Distribution
   DragDrop Extension

   The DynAPI Distribution is distributed under the terms of the GNU LGPL license.

   Requirements: 
	dynapi.api.*
*/ 
DynObject.prototype.DragDrop=function(s){ 
	if (!this.children.length>0) return false;
	var ch,chX,sX,sY;
	for (var i in this.children) { 
		ch=this.children[i]; 
		chX=ch.getPageX();
		chY=ch.getPageY(); 
		sX=s.getPageX();
		sY=s.getPageY(); 
		if (chX<sX && chX+ch.w>sX+s.w && chY<sY && chY+ch.h>sY+s.h) { 
			if (ch.DragDrop(s)) return true; 
			ch.invokeEvent("drop"); 
			return true; 
		}
	}
	return false; 
}; 