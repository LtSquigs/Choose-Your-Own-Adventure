import cgi
import datetime
import urllib
import wsgiref.handlers
import logging
import os

from django.utils import simplejson
from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

class Page(db.Model):
	pageNum = db.IntegerProperty()
	content = db.TextProperty()
	imageLink = db.TextProperty()
	time = db.DateTimeProperty(auto_now_add=True)
	
class PageLink(db.Model):
	linkText = db.TextProperty()
	pageFrom = db.IntegerProperty()
	pageTo = db.IntegerProperty()
	
class CurHighPage(db.Model):
	counter = db.IntegerProperty()
	
def increment_counter(key):
	obj = db.get(key)
	obj.counter += 1
	obj.put()
	
	return obj.counter
	
class MainPage(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'index.html')
		f = open(path);
		self.response.out.write(f.read());

	def post(self):
		response = { 'error' : False, 'errtext' : '', 'page' : '', 'pageLinks' : {}, 'imageLink' : ''}
		try:
			pageNum =  int(self.request.get('pageNum'));
			
			page = db.GqlQuery("SELECT * FROM Page WHERE pageNum = :1", pageNum);
			
			# Found Page
			if(page.count() >= 1):
				pageLinks = db.GqlQuery("SELECT * FROM PageLink WHERE pageFrom = :1", pageNum);
				for link in pageLinks:
					response['pageLinks'][link.pageTo] = link.linkText;
			
				response['page'] = page[0].content
				response['imageLink'] = page[0].imageLink
			else: # No Page Found
				response['error'] = True
				response['errtext'] = 'Page Not Found' 
				
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured' + str(inst)
	
		self.response.out.write(simplejson.dumps(response));
		
		
class AddPage(webapp.RequestHandler):
	def post(self):
		response = { 'error' : False, 'errtext' : '', 'newPage' : '' }
		try:
			pageNum = int(self.request.get('pageNum'))
			newPageText = cgi.escape(self.request.get('pageText'))
			newPageLink = cgi.escape(self.request.get('pageLinkText'))
			imageLink = cgi.escape(self.request.get('imageLink'))
			
			# Make sure there are enough pages left?
			
			# Escape the text of invalid characters, trimming to 1700
			newPageText = newPageText[:2500]
			
			acc = db.GqlQuery("SELECT * FROM CurHighPage").get()
			if(acc == None):
				acc = CurHighPage(counter = 1)
				acc.put()
				
			newNum = db.run_in_transaction(increment_counter, acc.key())
			
			# Add the new page, and add the new page link
			np = Page(pageNum = newNum, content = newPageText, imageLink = imageLink)
			np.put()
			
			npl = PageLink(pageFrom = pageNum, pageTo = newNum, linkText = newPageLink)
			npl.put()
		
			response['newPage'] = newNum
			
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured '  + str(inst)
			
		self.response.out.write(simplejson.dumps(response));
		
			
class UpdatePage(webapp.RequestHandler):
	def post(self):
		response = { 'error' : False, 'errtext' : '', 'newPage' : '' }
		try:
			pageNum = int(self.request.get('pageNum'))
			newPageText = cgi.escape(self.request.get('pageText'))
			imageLink = cgi.escape(self.request.get('imageLink'))
			
			# Make sure there are enough pages left?
			
			# Escape the text of invalid characters, trimming to 1700
			newPageText = newPageText[:2500]
			
			# Find the next lowest page number to add this to
			page = db.GqlQuery("SELECT * FROM Page WHERE pageNum = :1", pageNum).get()
			
			
			newPageText = newPageText.replace('\n', '<br/>')
			page.content = newPageText
			page.imageLink = imageLink
			page.put()
			
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured ' + str(inst)
			
		self.response.out.write(simplejson.dumps(response));
		
class DeletePage(webapp.RequestHandler):
	def post(self):
		response = { 'error' : False, 'errtext' : ''}
		try:
			pageNum = int(self.request.get('pageNum'))
			
			if pageNum == 1:
				raise Exception("Can't delete the first page")
			
			# Find the next lowest page number to add this to
			page = db.GqlQuery("SELECT * FROM Page WHERE pageNum = :1", pageNum).get()
			page.delete()
			
			pageLinks = db.GqlQuery("SELECT * FROM PageLink WHERE pageFrom = :1", pageNum)

			for link in pageLinks:
				link.delete()
			
			pageLinks = db.GqlQuery("SELECT * FROM PageLink WHERE pageTo = :1", pageNum)

			for link in pageLinks:
				link.delete()
			
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured ' + str(inst)
			
		self.response.out.write(simplejson.dumps(response));
		
class AddPageLink(webapp.RequestHandler):
	def post(self):
		response = { 'error' : False, 'errtext' : '', 'newPage' : '' }
		try:
			pageNum = int(self.request.get('pageNum'))
			pageLinkPage = int(cgi.escape(self.request.get('pageLinkPage')))
			newPageLink = cgi.escape(self.request.get('pageLinkText'))
			
			page = db.GqlQuery("SELECT * FROM Page WHERE pageNum = :1", pageLinkPage).get()
			
			if(page == None):
				raise Exception("Target page does not exist")
				
			oldPageLink = db.GqlQuery("SELECT * FROM PageLink WHERE pageTo = :1 AND pageFrom = :2",  pageNum, pageLinkPage).get()
			
			if(oldPageLink != None):
				raise Exception("Target already has link to page " + str(pageLinkPage))
				
			npl = PageLink(pageFrom = pageNum, pageTo = pageLinkPage, linkText = newPageLink)
			npl.put()
		
			response['newPage'] = pageLinkPage
			
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured '  + str(inst)
			
		self.response.out.write(simplejson.dumps(response));
		
class DeletePageLink(webapp.RequestHandler):
	def post(self):
		response = { 'error' : False, 'errtext' : '' }
		try:
			pageNum = int(self.request.get('pageNum'))
			pageLinkPage = int(cgi.escape(self.request.get('pageLinkPage')))
			
			pageLink = db.GqlQuery("SELECT * FROM PageLink WHERE pageFrom = :1 AND pageTo = :2", pageNum, pageLinkPage).get()
			
			if(pageLink == None):
				raise Exception("Link does not exist")
				
			pageLink.delete()
			
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured '  + str(inst)
			
		self.response.out.write(simplejson.dumps(response));
		
		
class UpdatePageLink(webapp.RequestHandler):
	def post(self):
		response = { 'error' : False, 'errtext' : '' }
		try:
			pageNum = int(self.request.get('pageNum'))
			pageLinkOldTo = int(self.request.get('pageLinkOldTo'))
			pageLinkNewTo = int(self.request.get('pageLinkNewTo'))
			pageLinkText = cgi.escape(self.request.get('pageLinkText'))
			
			pageLink = db.GqlQuery("SELECT * FROM PageLink WHERE pageFrom = :1 AND pageTo = :2", pageNum, pageLinkOldTo).get()
			
			if(pageLink == None):
				raise Exception("Link does not exist")
				
			oldPageLink = db.GqlQuery("SELECT * FROM PageLink WHERE pageTo = :1 AND pageFrom = :2",  pageNum, pageLinkNewTo).get()
			
			if(oldPageLink != None):
				raise Exception("Target already has link to page " + str(pageLinkNewTo))
				
			pageLink.pageTo = pageLinkNewTo
			pageLink.linkText = pageLinkText
			pageLink.put()
			
		except Exception, inst:
			response['error'] = True
			response['errtext'] = 'An Exception Has Occured '  + str(inst)
			
		self.response.out.write(simplejson.dumps(response));
		
application = webapp.WSGIApplication([('/', MainPage), ('/AddPage', AddPage), ('/AddPageLink', AddPageLink), ('/DeletePageLink', DeletePageLink), ('/UpdatePageLink', UpdatePageLink), ('/UpdatePage', UpdatePage), ('/DeletePage', DeletePage)],
										debug=True)


def main():
	run_wsgi_app(application)

if __name__ == '__main__':
	main()
