/*
	dWindowManager
		by Paul Jacobs
		
	some pieces borrowed from IBS by Ill Maestro
	(see www.richardinfo.com)
	
*/

dWindowManager = function(parentdoc) {
	if (!parentdoc) this.parent = DynAPI.document
	 else this.parent = parentdoc
	

	return this
}



dWindowManager.prototype.dWindowList = []
dWindowManager.prototype.zOrderList = []
dWindowManager.prototype.dWindowListGaps = []
dWindowManager.prototype.nextIndex = function () {
	var it = this.nextIndexNumber
	this.nextIndexNumber = this.nextIndexNumber + 1
	return it
}
dWindowManager.prototype.nextIndexNumber = 0;

dWindowManager.prototype.moveToTop = function(w) {

// recreate zOrderList, setting zIndexes along the way

	var newList = new Array()
	

	var counter = 0
	
	for (i=0;i<this.zOrderList.length;++i) {
		if (this.zOrderList[i] != w) {
			newList[counter] = this.zOrderList[i]
			newList[counter].index = counter
			newList[counter].setZIndex(counter++)			
		}
	}

	newList[counter] = w
	w.setZIndex(counter)

	this.zOrderList = newList
	
}

dWindowManager.prototype.add = function (title,x,y,w,h,content,resizable,bg,style,tabs) {
	
  // create dWindow widget object
  	var index = this.nextIndex();
  	 //alert("creating index "+index+" - "+title)

if (tabs) {
	this.dWindowList[index] = new dTabbedWindow(index+"-"+title, x, y, w, h, title, content,resizable,bg,this,index,style,tabs);
} else {
	this.dWindowList[index] = new dWindow(index+"-"+title, x, y, w, h, title, content,resizable,bg,this,index,style);
}	
	this.dWindowList[index].setZIndex(index);
	this.zOrderList[index] = this.dWindowList[index]; 
		// once you click on a bg window the zOrderList will reshuffle,
		// but not the window list.
		// if you hide a window it dissapears from the zOrder list, but is still
		// be referenced in the window list (so it's not lost forever)
	
	
  // add mydWindow widget to the parent dynlayer
  	DynAPI.document.addChild(this.dWindowList[index]);
}


