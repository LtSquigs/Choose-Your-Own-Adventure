var POST_URL = "/";

var oldPageStack = [0]
var newPage = 0;
var noHashChange = false;

var removeBacks = false;

var preLoadList = ["/scripts/add.png", "/scripts/back.png","/scripts/bookBackground.png","/scripts/bookBackLeft.png","/scripts/bookBackRight.png","/scripts/cover.png",
				   "/scripts/delete.png","/scripts/pageLeft.jpg","/scripts/pageRight.jpg"];

$(document).ready( function() {

	centerObject($('#loadingImage'));

	$.imgpreload(preLoadList, function ()
	{
		loadBook();
		$('#loadingImage').hide();
	});

});

function loadBook()
{
	$(window).resize(function(){
		centerObject($('.mainContent'));

	});

	$(window).resize();
	
	var book = $('#mainBook').find('.b-load').first();
	for(var i = 1; i < 99; i++)
	{
		book.append('<div><div style="position:absolute; width: 100%; height: 100%" class="backgroundPageLeft"></div><div class="pageLeft"><div class="pageLeftImg" id="pageLeft-' + i + '"></div></div></div>');
		book.append('<div><div style="position:absolute; width: 100%; height: 100%" class="backgroundPageRight"></div><div id="page-' + i + '" class="page"></div></div>');
	}
	
	$('#mainBook').append('<div style="position:absolute; width:100%; height: 100%" class="bookBack"></div>');
	
	$('#mainBook').booklet({
		closed: true,
		covers: true,
		autoCenter: true,
		pageNumbers: false,
		width: '100%',
		height: '100%',
		manual: false,
		keyboard: false,
		overlays: false,
		pagePadding: 0,
		after: function (){
		
			if(removeBacks == true)
			{
				$('.bookBack').show();
				$('.backgroundPageLeft').hide();
				$('.backgroundPageRight').hide();
				
				removeBacks = false;
			}
		}
	});
	
	$('.bookBack').hide();
	$('.backgroundPageLeft').hide();
	$('.backgroundPageRight').hide();
	
	$('#coverPage').click( function() {
		goToPage(1);
	});
	
	$(window).hashchange( function() {
		if(noHashChange)
		{
			noHashChange = false;
			return;
		}
		var pg = location.hash.slice(1);
		
		goToPage(pg);
	});


	if(location.hash != "")
	{
		var pg = location.hash.slice(1);
		setTimeout('goToPage(' + pg + ')', 1000);
	}
}

function goToEnd()
{
	$('#mainBook').booklet(199);
}

function goToPage(pageNum)
{
	var oldPage = oldPageStack[oldPageStack.length - 1];
	oldPageStack.push(pageNum);
	loadPage(pageNum, oldPage);
}
	
function back()
{
	var olderPage = oldPageStack.pop();
	oldPage = oldPageStack[oldPageStack.length - 1]
	loadPage(oldPage, olderPage);
}
	
function reLoadPage(page)
{
	var prevPageItem = $('#page-'+page);
	var prevPageLeftItem = $('#pageLeft-'+page);
	prevPageItem.html('');
	prevPageLeftItem.html('');
	
	loadPageAjax(page);
}
	
function loadPageAjax(page)
{

	$.ajax({
			url: POST_URL,
			type: "POST",
			dataType: "json",
			data: {
				pageNum: page
			},
			success: function (data) {
				if(data['error'] == 'true'  || data['error'] == true)
				{
					alert('Error occured while loading page\n' + data['errtext']);
					return;
				}
				else
				{
					var pageItem = $('#page-'+page);
					var pageLeftItem = $('#pageLeft-'+page);
					
					pageItem.html('');
					
					var backLink = $('<div class="backButton"><a href="javascript: void(0)" onclick="back();"><img src="scripts/back.png"></img></a></div>');
					
					pageItem.append(backLink);
					
					if(data['imageLink'] != '' && data['imageLink'] != null)
					{
						var image = $('<img></img>').attr('src', data['imageLink']);
						image.appendTo(pageLeftItem);
					}
					
					var pageNum = $('<div class="pageNum">Page ' + page + '</div>');
					pageItem.append(pageNum);
					
					var pageText = String(data['page']);
					
					var pageData = $('<div style="overflow: hidden; height: 390px; white-space: pre-wrap;"><p>' + pageText + '</p></div>');
					pageItem.append(pageData);
					
					var linksDiv = $('<div class="pageLinks"></div>');
					var pl = data['pageLinks'];
					
					var numLinks = 0;
					for(var key in pl)
					{
						var link = $('<a href="#' + key + '" class="pageLinkClass">If you ' + pl[key] + ' turn to Page ' + key + '</a><br/><br/>');
						link.appendTo(linksDiv);
						link.data('pageTo', key);
						link.data('pageText', pl[key]);
						
						numLinks = numLinks + 1;
					}
					
					
					pageItem.append(linksDiv);
					addEditPageButton(pageItem, pageLeftItem, data['page'], '', data['imageLink'], page);
					
					if(page != 1)
						addDeletePageButton(pageItem, page);
					
					if(numLinks < 4)
					{
						addAddPageButton(pageItem, page);
					}
					
					
				}
			},
			async: false
		});
}
	
function loadPage(pageNum, oldPage)
{

	if(oldPage !=0 )
	{
		var prevPageItem = $('#page-'+oldPage);
		var prevPageLeftItem = $('#pageLeft-'+oldPage);
		prevPageItem.html('');
		prevPageLeftItem.html('');
	}

	if(oldPage == 0)
	{
		$('.backgroundPageLeft').show();
		$('.backgroundPageRight').show();
		removeBacks = true;
	}
	
	if(pageNum == 0)
	{
		$('.backgroundPageLeft').show();
		$('.backgroundPageRight').show();
		$('.bookBack').hide();
	}
	
	if(pageNum != 0)
	{
		loadPageAjax(pageNum);
	}
	
	var pgNumTo = Number(pageNum);
	
	if(pgNumTo >= 97)
		pgNumTo = (pgNumTo % 97) + 1;
	
	$('#mainBook').booklet((pgNumTo * 2) + 1);
			
	var newHash = "#" + pageNum;
	
	if(newHash != location.hash)
	{
		noHashChange = true;
		location.hash = "#" + pageNum;
	}
}

function addAddPageButton(pageItem, curPage)
{
	var addDiv = $('<div class="addPageDiv"></div>');
					
	var addDivHeader = $('<div class="addPageDivHeader">Add Page</div>');
	addDivHeader.appendTo(addDiv);
	
	var addDivInputs = $('<div class="addPageInputDiv"></div>');
	
	var addImageLink = $('<span><b>Image Link (Optional):</b><br/><input type="text" id="imageLink" size="68px"/><br/></span>');
	var addPageLink = $('<span><b>Page Link:</b><br/> If you <input type="text" id="pageLinkText" size="45px"/> turn to page X<br/></span>');
	var addPageText = $('<b>Page Text:</b><br/><div id="pageTextAreaDiv" style="position:relative;"><textarea cols="68" rows="24" id="pageTextArea"></textarea></div>');
	
	addPageLink.appendTo(addDivInputs);
	addImageLink.appendTo(addDivInputs);
	addPageText.appendTo(addDivInputs);
	addDivInputs.appendTo(addDiv);
	
	addDiv.hide();
	
	var closeLink = $('<div class="closeLink"><img src="scripts/delete.png"></div>');
	addDiv.append(closeLink);
	
	pageItem.append(addDiv);
	
	var addPageLink = $('<div class="addPageLink">Add Page</div>');
	addDiv.append(addPageLink);
	
	addPageLink.css({
		left: (addDiv.width() - addPageLink.outerWidth())/2,
		top: '575px'
	});
	
	addPageLink.bind('click', { page: curPage }, function () {
		$.ajax({
			url: POST_URL + "AddPage",
			type: "POST",
			dataType: "json",
			data: {
				pageNum: curPage,
				pageText: $('#pageTextArea').val(),
				pageLinkText: $('#pageLinkText').val(),
				imageLink: $('#imageLink').val()
			},
			success: function (data) {
				if(data['error'] == 'true' || data['error'] == true)
				{
					alert('Error occured while loading page\n' + data['errtext']);
				}
				else
				{
					goToPage(data['newPage']);
				}
			}
			
		});
		
	});
	
	addLink = $('<div class="addLink"><span>Add Page</span><img src="scripts/add.png"></div>');
	pageItem.append(addLink);
	
	addLink.click( function() {
		addLink.hide();
		addDiv.show();
		addDiv.animate({
			height: '580px'
		}, 1000);
		
	});
	
	closeLink.click( function() {
		addDiv.animate({
			height: '10px'
		}, 1000, function() {
			addDiv.hide();
			addLink.show();
		});
		
	});
}

function addEditPageButton(pageItem, pageLeftItem, pageText, pageLink, pageImage, curPage)
{
	
	var editImageLink = $('<div class="editImageLink"><span><b>Image Link (Optional):</b><br/><input type="text" id="editImageLink"/><br/></span></div>');
	var editPageText = $('<div class="editTextBox"><div id="editPageTextAreaDiv" style="position:relative;"><textarea id="editPageTextArea"></textarea></div></div>');
	
	editImageLink.hide();
	editPageText.hide();
	
	editImageLink.appendTo(pageLeftItem);
	editPageText.appendTo(pageItem);
	
	$('#editImageLink').val(pageImage);
	$('#editPageTextArea').val(pageText.replace(/<br\/>/g, '\n'));
	
	
	var editPageLinkBoxes = $('<div class="editPageLinkBoxes"></div>');
	editPageLinkBoxes.appendTo(pageItem);
	
	var existingLinks = $('.pageLinkClass');
	
	var numExisting = 0;
	
	for(var i = 0; i < existingLinks.length; i++)
	{
		var link = $(existingLinks[i]);
		var divWrap = $('<div class="padBottom editPageLinkBox">If you </div>').appendTo(editPageLinkBoxes);
		
		divWrap.data('oldLink', 'True');
		divWrap.data('pageTo', link.data('pageTo'));
		divWrap.data('pageText', link.data('pageText'));
		
		var editPageLinkBox = $('<input type="text" id="pageLink" class="editPageLinkText" />').appendTo(divWrap);
		$('<span> turn to Page </span>').appendTo(divWrap);
		var editPageLinkNumBox = $('<input type=text" id="pageNum" class="editPageLinkNum" />').appendTo(divWrap);
		
		editPageLinkBox.val(link.data('pageText'));
		editPageLinkNumBox.val(link.data('pageTo'));
		
		numExisting = numExisting + 1;
	}
	
	for(var i = numExisting; i < 4; i ++)
	{
		var divWrap = $('<div class="padBottom editPageLinkBox">If you </div>').appendTo(editPageLinkBoxes);
		
		divWrap.data('oldLink', 'False');
		
		var editPageLinkBox = $('<input type="text" id="pageLink" class="editPageLinkText" />').appendTo(divWrap);
		$('<span> turn to Page </span>').appendTo(divWrap);
		var editPageLinkNumBox = $('<input type=text" id="pageNum" class="editPageLinkNum" />').appendTo(divWrap);
	}
	
	editPageLinkBoxes.hide();
	
	
	
	editLink = $('<div class="editLink"><span>Edit Page</span></div>');
	pageItem.append(editLink);
	
	saveLink = $('<div class="saveLink"><span>Save</span></div>');
	saveLink.hide();
	pageItem.append(saveLink);
	
	cancelLink = $('<div class="cancelEditLink"><span>Cancel</span></div>');
	cancelLink.hide();
	pageItem.append(cancelLink);
	
	
	saveLink.bind('click', { page: curPage }, function () {
		$.ajax({
			url: POST_URL + "UpdatePage",
			type: "POST",
			dataType: "json",
			data: {
				pageNum: curPage,
				pageText: $('#editPageTextArea').val(),
				imageLink: $('#editImageLink').val()
			},
			success: function (data) {
				if(data['error'] == 'true' || data['error'] == true)
				{
					alert('Error occured while updating page\n' + data['errtext']);
				}
			},
			async: false
			
		});
		
		var pageLinks = $('.editPageLinkBox');
		
		/* Handle Deleting links */
		for(var i = 0; i < pageLinks.length; i++)
		{
			var link = $(pageLinks[i]);
			if(link.data('oldLink') == 'True' && link.find('.editPageLinkNum').first().val() == '')
			{
				// Send Ajax to delete
				$.ajax({
					url: POST_URL + "DeletePageLink",
					type: "POST",
					dataType: "json",
					data: {
						pageNum: curPage,
						pageLinkPage: link.data('pageTo')
					},
					success: function (data) {
						if(data['error'] == 'true' || data['error'] == true)
						{
							alert('Error occured while deleting page link\n' + data['errtext']);
						}
					},
					async: false
				});
			}
		}
		
		/* Handle Updating Links */
		for(var i = 0; i < pageLinks.length; i++)
		{
			var link = $(pageLinks[i]);
			if(link.data('oldLink') == 'True' && ((link.find('.editPageLinkNum').first().val() != link.data('pageTo') && link.find('.editPageLinkNum').first().val() != '') ||  
												  link.find('.editPageLinkText').first().val() != link.data('pageText') ))
			{
				$.ajax({
					url: POST_URL + "UpdatePageLink",
					type: "POST",
					dataType: "json",
					data: {
						pageNum: curPage,
						pageLinkOldTo: link.data('pageTo'),
						pageLinkNewTo: link.find('.editPageLinkNum').first().val(),
						pageLinkText: link.find('.editPageLinkText').first().val()
					},
					success: function (data) {
						if(data['error'] == 'true' || data['error'] == true)
						{
							alert('Error occured while updating page link\n' + data['errtext']);
						}
					},
					async: false
				});
			}
		}
		
		/* Handle Adding Links */
		for(var i = 0; i < pageLinks.length; i++)
		{
			var link = $(pageLinks[i]);
			if(link.data('oldLink') == 'False' && (link.find('.editPageLinkNum').first().val() != ''))
			{
				$.ajax({
					url: POST_URL + "AddPageLink",
					type: "POST",
					dataType: "json",
					data: {
						pageNum: curPage,
						pageLinkText: link.find('.editPageLinkText').first().val(),
						pageLinkPage: link.find('.editPageLinkNum').first().val()
					},
					success: function (data) {
						if(data['error'] == 'true' || data['error'] == true)
						{
							alert('Error occured while adding page link\n' + data['errtext']);
						}
					},
					async: false
				});
				
			}
		}

		reLoadPage(curPage);
	});
	
	editLink.click( function() {
		editImageLink.show();
		editPageText.show();
		saveLink.show();
		cancelLink.show();
		editPageLinkBoxes.show();
		
		$('.pageLinks').hide();
		editLink.hide();
	});
	
	cancelLink.click( function() {
		editImageLink.hide();
		editPageText.hide();
		saveLink.hide();
		cancelLink.hide();
		editPageLinkBoxes.hide();
		
		$('.pageLinks').show();
		editLink.show();
	});
	
}

function addDeletePageButton(pageItem, curPage)
{
	var deleteLink = $('<div class="deleteButton"><img src="scripts/delete.png" /><span>Delete Page</span></div>').appendTo(pageItem);
	
	deleteLink.click( function() {
		
		$.ajax({
			url: POST_URL + "DeletePage",
			type: "POST",
			dataType: "json",
			data: {
				pageNum: curPage,
			},
			success: function (data) {
				if(data['error'] == 'true' || data['error'] == true)
				{
					alert('Error occured while deleting page\n' + data['errtext']);
				}
				else
				{
					back();
				}
			}
			
		});
		
	});
}

function centerObject(obj)
{
	$(obj).css({
		position:'absolute',
		left: ($(window).width() - $(obj).outerWidth())/2,
		top: ($(window).height() - $(obj).outerHeight())/2
	});
}