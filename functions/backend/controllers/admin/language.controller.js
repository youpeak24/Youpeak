const db = require("../../util/connection");

// create language
exports.forgeLanguage = async (req, res) => {
  try {
    const { languageTitle, languageCode, localLanguageTitle, languageIcon } = req.body;
    const isDefault = req.body.isDefault === true || req.body.isDefault === "true";
    const isActive = req.body.isActive === true || req.body.isActive === "true";

    if (!languageTitle?.trim() || !languageCode?.trim() || !localLanguageTitle?.trim()) {
      return res.status(200).json({ status: false, message: "All fields are required" });
    }

    const code = languageCode.trim().toLowerCase();
    const existing = await db.findOne("languages", { languageCode: code });
    if (existing) {
      return res.status(200).json({ status: false, message: "Language already exists" });
    }

    if (isDefault) {
      const allLangs = await db.find("languages", {});
      for (const lang of allLangs) {
        if (lang.isDefault) {
          await db.update("languages", lang._id || lang.id, { isDefault: false });
        }
      }
    }

    const newLang = await db.create("languages", {
      languageTitle: languageTitle.trim(),
      languageCode: code,
      localLanguageTitle: localLanguageTitle.trim(),
      languageIcon: languageIcon || "https://youpeak-9ff65.web.app/logo.png",
      isDefault,
      isActive,
      errorCount: 0,
    });

    return res.status(200).json({
      status: true,
      message: "Language created successfully",
      data: newLang,
    });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// get all languages (harvestLanguages)
exports.harvestLanguages = async (req, res) => {
  const defaultLang = {
    _id: "lang_en",
    languageTitle: "English",
    languageCode: "en",
    localLanguageTitle: "English",
    languageIcon: "https://youpeak-9ff65.web.app/logo.png",
    isDefault: true,
    isActive: true,
    errorCount: 0,
  };

  try {
    let languages = await db.find("languages", {});

    // Seed default English language if empty
    if (!languages || languages.length === 0) {
      try {
        const createdLang = await db.create("languages", defaultLang, "lang_en");
        if (createdLang) languages = [createdLang];
      } catch (e) {}
      if (!languages || languages.length === 0) {
        languages = [defaultLang];
      }
    }

    return res.status(200).json({
      status: true,
      message: "Languages fetched",
      total: languages.length,
      data: languages,
    });
  } catch (error) {
    console.error("Error harvesting languages:", error);
    return res.status(200).json({
      status: true,
      message: "Languages fetched",
      total: 1,
      data: [defaultLang],
    });
  }
};

// get single language
exports.harvestLanguage = async (req, res) => {
  try {
    const { languageCode } = req.query;
    const language = await db.findOne("languages", { languageCode: (languageCode || "en").toLowerCase() });
    return res.status(200).json({ status: true, message: "Language fetched", data: language });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// update language
exports.refineLanguage = async (req, res) => {
  try {
    const { languageCode } = req.body;
    const language = await db.findOne("languages", { languageCode: (languageCode || "").toLowerCase() });
    if (!language) return res.status(200).json({ status: false, message: "Language not found" });

    if (req.body.isDefault === true || req.body.isDefault === "true") {
      const allLangs = await db.find("languages", {});
      for (const lang of allLangs) {
        if ((lang._id || lang.id) !== (language._id || language.id) && lang.isDefault) {
          await db.update("languages", lang._id || lang.id, { isDefault: false });
        }
      }
    }

    const updated = await db.update("languages", language._id || language.id, req.body);
    return res.status(200).json({ status: true, message: "Language updated successfully", data: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// toggle switch
exports.shiftLanguageState = async (req, res) => {
  try {
    const { languageCode, toggleType } = req.query;
    const language = await db.findOne("languages", { languageCode: (languageCode || "").toLowerCase() });
    if (!language) return res.status(200).json({ status: false, message: "Language not found" });

    const updateData = {};
    if (Number(toggleType) === 1) updateData.isActive = !language.isActive;
    if (Number(toggleType) === 2) {
      updateData.isDefault = true;
      const allLangs = await db.find("languages", {});
      for (const lang of allLangs) {
        if ((lang._id || lang.id) !== (language._id || language.id) && lang.isDefault) {
          await db.update("languages", lang._id || lang.id, { isDefault: false });
        }
      }
    }

    const updated = await db.update("languages", language._id || language.id, updateData);
    return res.json({ status: true, message: "Language updated successfully", data: updated });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

// delete language
exports.obliterateLanguage = async (req, res) => {
  try {
    const { languageCode } = req.query;
    const language = await db.findOne("languages", { languageCode: (languageCode || "").toLowerCase() });
    if (language) {
      await db.delete("languages", language._id || language.id);
    }
    return res.status(200).json({ status: true, message: "Language deleted successfully" });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
