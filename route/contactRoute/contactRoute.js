const express = require("express");
const {
  submitContactForm,
  getAllContacts,
  getContactById,
  replyToContact,
  deleteContact,
} = require("../../controller/contactController/contactController");

const router = express.Router();


router.post("/submit", submitContactForm);

router.get("/all", getAllContacts);
router.get("/:contactId",getContactById);
router.post("/:contactId/reply",  replyToContact);
router.delete("/:contactId",deleteContact);

module.exports = router;
