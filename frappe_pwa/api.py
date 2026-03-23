import frappe
from frappe import _

@frappe.whitelist(allow_guest=True)
def get_manifest():
	settings = frappe.get_single("PWA Settings")
	
	manifest = {
		"name": settings.app_name or "Frappe ERP",
		"short_name": settings.app_short_name or "Frappe",
		"description": settings.description or "Enterprise Resource Planning with Frappe",
		"start_url": "/app",
		"scope": "/",
		"display": "standalone",
		"background_color": settings.background_color or "#ffffff",
		"theme_color": settings.theme_color or "#0089FF",
		"icons": [],
		"shortcuts": []
	}
	
	for s in settings.get("shortcuts") or []:
		shortcut = {
			"name": s.label,
			"url": s.url,
			"description": s.description or ""
		}
		if s.icon:
			# Ensure absolute URL for iOS shortcuts
			icon_url = s.icon if s.icon.startswith('http') else frappe.utils.get_url(s.icon)
			shortcut["icons"] = [{
				"src": icon_url, 
				"sizes": "192x192",
				"type": "image/png",
				"purpose": "any"
			}]
		manifest["shortcuts"].append(shortcut)

	if settings.app_logo:
		# iOS and Android both benefit from explicit types and purpose
		logo_url = settings.app_logo
		manifest["icons"].append({
			"src": logo_url,
			"sizes": "192x192",
			"type": "image/png",
			"purpose": "any maskable"
		})
		manifest["icons"].append({
			"src": logo_url,
			"sizes": "512x512",
			"type": "image/png",
			"purpose": "any maskable"
		})
	else:
		# Fallback icons
		manifest["icons"] = [
			{
				"src": "/assets/frappe/images/frappe-framework-logo.svg",
				"sizes": "192x192",
				"type": "image/svg+xml"
			},
			{
				"src": "/assets/frappe/images/frappe-framework-logo.svg",
				"sizes": "512x512",
				"type": "image/svg+xml"
			}
		]

	frappe.response["type"] = "json"
	frappe.response["body"] = manifest

@frappe.whitelist()
def sync_offline_action(doctype, docname, action, data):
	"""
	Universal handler for syncing offline actions with permission checks.
	"""
	if not doctype or not action:
		return {"status": "error", "message": _("Missing doctype or action")}

	# Data validation
	if isinstance(data, str):
		try:
			import json
			data = json.loads(data)
		except:
			return {"status": "error", "message": _("Invalid data format")}

	if action == "update":
		if not frappe.has_permission(doctype, "write", docname):
			return {"status": "error", "message": _("No permission to update {0}").format(docname)}
		
		doc = frappe.get_doc(doctype, docname)
		doc.update(data)
		doc.save()
		return {"status": "success", "message": _("{0} {1} updated").format(doctype, docname)}
	
	elif action == "create":
		if not frappe.has_permission(doctype, "create"):
			return {"status": "error", "message": _("No permission to create {0}").format(doctype)}
		
		doc = frappe.new_doc(doctype)
		doc.update(data)
		doc.insert()
		return {"status": "success", "message": _("{0} created").format(doctype)}
	
	return {"status": "error", "message": _("Action {0} not supported").format(action)}


@frappe.whitelist()
def get_search_data():
	"""
	Returns a list of searchable records for offline indexing.
	In a real scenario, this would be highly optimized and filtered.
	"""
	# Indexing ToDos as an example
	todos = frappe.get_all("ToDo", fields=["name", "description", "status", "owner"])
	
	# Indexing Customers (if they exist)
	customers = []
	if frappe.db.exists("DocType", "Customer"):
		customers = frappe.get_all("Customer", fields=["name", "customer_name", "territory"], limit=100)
		
	return {
		"ToDo": todos,
		"Customer": customers
	}


