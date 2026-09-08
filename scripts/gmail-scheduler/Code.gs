/**
 * JobFlow Gmail Scheduler — Google Apps Script
 *
 * Runs entirely inside Google's cloud. JobFlow POSTs a /schedule_send payload
 * here, and this script creates a one-time time-based trigger that sends the
 * email at the requested time. Nothing needs to run on the user's machine.
 *
 * SECURITY (fail-closed by default):
 * - The web app is deployed with "Anyone" access, so it MUST require a token.
 * - If no token is configured (CONFIG_TOKEN or script property `jobflow_token`),
 *   the script REFUSES every request. Do not leave it open.
 *
 * DEPLOY (one time, ~3 min):
 * 1. https://script.google.com  →  New project  →  delete the default code.
 * 2. Paste this whole file, then set CONFIG_TOKEN below to a strong random
 *    string (or set the script property `jobflow_token` to the same value).
 *    The exact same value has to be pasted into JobFlow → Settings → Gmail Scheduler → Token.
 * 3. Deploy → New deployment → Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Copy the /exec URL (e.g. https://script.google.com/macros/s/XXX/exec)
 * 4. Paste that URL into JobFlow Settings → Gmail Scheduler → Scheduler URL.
 *
 * NOTES:
 * - Gmail free accounts allow ~100 sends/day via GmailApp. If you hit the cap,
 *   a scheduled send will fail loudly in the script logs; the draft stays in Gmail.
 * - Cron-style triggers only fire while Google runs this script; drafts are the
 *   source of truth and are never lost.
 */

/**
 * Set this to a strong random string. OPTIONAL alternative: set the script
 * property `jobflow_token` (Script Properties) to the same value. Leave BOTH
 * empty and the script rejects all requests (fail-closed).
 */
var CONFIG_TOKEN = "";

var PROP_PREFIX = "jobflow_send_";

function configuredToken() {
  return (
    CONFIG_TOKEN ||
    PropertiesService.getScriptProperties().getProperty("jobflow_token") ||
    ""
  );
}

function requireValidToken(payloadToken) {
  var token = configuredToken();
  if (!token) {
    throw new Error(
      "Scheduler token is not configured. Set CONFIG_TOKEN (or script property jobflow_token) to a strong value and enter the SAME value in JobFlow Settings -> Gmail Scheduler."
    );
  }
  if (payloadToken !== token) {
    throw new Error("Invalid token.");
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(String(e.postData.contents || ""));

    requireValidToken(payload.token || "");

    if (payload.action !== "schedule_send") {
      throw new Error("Unknown action: must be 'schedule_send'.");
    }

    var when = new Date(payload.when);
    if (isNaN(when.getTime())) {
      throw new Error("Invalid 'when' date.");
    }
    if (when.getTime() <= Date.now()) {
      throw new Error("'when' must be in the future.");
    }
    if (!payload.to || !payload.subject || !payload.body) {
      throw new Error("Missing to / subject / body.");
    }

    // One trigger, one payload. The trigger's unique ID keys the stored payload,
    // so the fire handler sends exactly this one email and deletes exactly
    // this one trigger — other scheduled sends are never touched.
    var trigger = ScriptApp.newTrigger("sendScheduledMail")
      .timeBased()
      .at(when)
      .create();

    var triggerId = trigger.getUniqueId();
    PropertiesService.getScriptProperties().setProperty(
      PROP_PREFIX + triggerId,
      JSON.stringify(payload)
    );

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, scheduledFor: when.toISOString(), triggerId: triggerId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(error) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendScheduledMail(trigger) {
  var props = PropertiesService.getScriptProperties();
  var triggerId = trigger ? trigger.getUniqueId() : null;
  if (!triggerId) return;

  var key = PROP_PREFIX + triggerId;
  var raw = props.getProperty(key);
  if (!raw) {
    // Nothing stored for this trigger (already handled or lost) — clean it up.
    ScriptApp.deleteTrigger(trigger);
    return;
  }

  var data = JSON.parse(raw);
  var when = new Date(data.when);
  if (when.getTime() > Date.now()) return; // not due yet; leave for a later fire

  var options = {};
  if (data.attachmentBase64 && data.attachmentName) {
    options.attachments = [
      Utilities.newBlob(
        Utilities.base64Decode(data.attachmentBase64),
        "application/pdf",
        data.attachmentName
      ),
    ];
  }

  GmailApp.sendEmail(data.to, data.subject, data.body, options);
  props.deleteProperty(key);
  ScriptApp.deleteTrigger(trigger);
}

// Optional manual test/diagnostic entry: logs all pending scheduled sends.
function listPending() {
  var props = PropertiesService.getScriptProperties();
  var keys = props.getProperties();
  Logger.log(
    Object.keys(keys).filter(function (k) { return k.startsWith(PROP_PREFIX); })
  );
}