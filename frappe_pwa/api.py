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
		"icons": []
	}

	if settings.app_logo:
		manifest["icons"].append({
			"src": settings.app_logo,
			"sizes": "192x192",
			"type": "image/png" if settings.app_logo.endswith(".png") else "image/svg+xml"
		})
		manifest["icons"].append({
			"src": settings.app_logo,
			"sizes": "512x512",
			"type": "image/png" if settings.app_logo.endswith(".png") else "image/svg+xml"
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
	Universal handler for syncing offline actions.
	For now, it supports simple doc updates.
	"""
	if action == "update":
		doc = frappe.get_doc(doctype, docname)
		doc.update(data)
		doc.save()
		return {"status": "success", "message": _("{0} {1} updated").format(doctype, docname)}
	
	elif action == "create":
		doc = frappe.new_doc(doctype)
		doc.update(data)
		doc.insert()
		return {"status": "success", "message": _("{0} created").format(doctype)}
	
	return {"status": "error", "message": _("Action {0} not supported").format(action)}

