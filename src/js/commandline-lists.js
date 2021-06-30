import * as DB from "./db";
import * as Misc from "./misc";
import layouts from "./layouts";
import * as Notifications from "./notifications";
import * as Sound from "./sound";
import * as TestStats from "./test-stats";
import * as ThemeController from "./theme-controller";
import * as CustomTextPopup from "./custom-text-popup";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as PractiseMissed from "./practise-missed";
import * as TestUI from "./test-ui";
import * as TestLogic from "./test-logic";
import * as Funbox from "./funbox";
import * as TagController from "./tag-controller";
import * as PresetController from "./preset-controller";
import * as Commandline from "./commandline";
import * as CustomText from "./custom-text";
import * as Settings from "./settings";

export let current = [];

function canBailOut() {
  return (
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      (CustomText.word >= 5000 || CustomText.word == 0)) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      CustomText.text.length >= 5000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      (CustomText.time >= 3600 || CustomText.time == 0)) ||
    (Config.mode === "words" && Config.words >= 5000) ||
    Config.words === 0 ||
    (Config.mode === "time" && (Config.time >= 3600 || Config.time === 0)) ||
    Config.mode == "zen"
  );
}

let commandsLayouts = {
  title: "Change layout...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

if (Object.keys(layouts).length > 0) {
  commandsLayouts.list = [];
  Object.keys(layouts).forEach((layout) => {
    commandsLayouts.list.push({
      id: "changeLayout" + Misc.capitalizeFirstLetter(layout),
      display: layout.replace(/_/g, " "),
      exec: () => {
        // UpdateConfig.setSavedLayout(layout);
        UpdateConfig.setLayout(layout);
        TestLogic.restart();
      },
    });
  });
}

export let commandsKeymapLayouts = {
  title: "Change keymap layout...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the layouts list :(",
    },
  ],
};

if (Object.keys(layouts).length > 0) {
  commandsKeymapLayouts.list = [];
  commandsKeymapLayouts.list.push({
    id: "changeKeymapLayoutOverrideSync",
    display: "override sync",
    exec: () => {
      UpdateConfig.setKeymapLayout("overrideSync");
      TestLogic.restart();
    },
  });
  Object.keys(layouts).forEach((layout) => {
    if (layout.toString() != "default") {
      commandsKeymapLayouts.list.push({
        id: "changeKeymapLayout" + Misc.capitalizeFirstLetter(layout),
        display: layout.replace(/_/g, " "),
        exec: () => {
          UpdateConfig.setKeymapLayout(layout);
          TestLogic.restart();
        },
      });
    }
  });
}

let commandsLanguages = {
  title: "Change language...",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

commandsLanguages.list = [];
Misc.getLanguageList().then((languages) => {
  languages.forEach((language) => {
    commandsLanguages.list.push({
      id: "changeLanguage" + Misc.capitalizeFirstLetter(language),
      display: language.replace(/_/g, " "),
      exec: () => {
        UpdateConfig.setLanguage(language);
        TestLogic.restart();
      },
    });
  });
});

let commandsFunbox = {
  title: "Change funbox...",
  list: [
    {
      id: "changeFunboxNone",
      display: "none",
      exec: () => {
        if (Funbox.setFunbox("none", null)) {
          TestLogic.restart();
        }
      },
    },
  ],
};

Misc.getFunboxList().then((funboxes) => {
  funboxes.forEach((funbox) => {
    commandsFunbox.list.push({
      id: "changeFunbox" + funbox.name,
      display: funbox.name.replace(/_/g, " "),
      exec: () => {
        if (Funbox.setFunbox(funbox.name, funbox.type)) {
          TestLogic.restart();
        }
      },
    });
  });
});

let commandsFonts = {
  title: "Change font...",
  list: [],
};

Misc.getFontsList().then((fonts) => {
  fonts.forEach((font) => {
    commandsFonts.list.push({
      id: "changeFont" + font.name.replace(/ /g, "_"),
      display: font.display !== undefined ? font.display : font.name,
      hover: () => {
        UpdateConfig.previewFontFamily(font.name);
      },
      exec: () => {
        UpdateConfig.setFontFamily(font.name.replace(/ /g, "_"));
      },
    });
  });
  commandsFonts.list.push({
    id: "setFontFamilyCustom",
    display: "custom...",
    input: true,
    hover: () => {
      UpdateConfig.previewFontFamily(Config.fontFamily);
    },
    exec: (name) => {
      UpdateConfig.setFontFamily(name.replace(/\s/g, "_"));
      // Settings.groups.fontFamily.updateButton();
    },
  });
});

let commandsTags = {
  title: "Change tags...",
  list: [],
};

export function updateTagCommands() {
  if (DB.getSnapshot().tags.length > 0) {
    commandsTags.list = [];

    commandsTags.list.push({
      id: "clearTags",
      display: "Clear tags",
      exec: () => {
        DB.getSnapshot().tags.forEach((tag) => {
          tag.active = false;
        });
        TestUI.updateModesNotice();
        TagController.saveActiveToLocalStorage();
      },
    });

    DB.getSnapshot().tags.forEach((tag) => {
      let dis = tag.name;

      if (tag.active === true) {
        dis = '<i class="fas fa-check-square"></i>' + dis;
      } else {
        dis = '<i class="fas fa-square"></i>' + dis;
      }

      commandsTags.list.push({
        id: "toggleTag" + tag.id,
        display: dis,
        sticky: true,
        exec: () => {
          TagController.toggle(tag.id);
          TestUI.updateModesNotice();
          let txt = tag.name;

          if (tag.active === true) {
            txt = '<i class="fas fa-check-square"></i>' + txt;
          } else {
            txt = '<i class="fas fa-square"></i>' + txt;
          }
          if (Commandline.isSingleListCommandLineActive()) {
            $(
              `#commandLine .suggestions .entry[command='toggleTag${tag.id}']`
            ).html("Change tags > " + txt);
          } else {
            $(
              `#commandLine .suggestions .entry[command='toggleTag${tag.id}']`
            ).html(txt);
          }
        },
      });
    });
    // defaultCommands.list[4].visible = true;
  }
}

let commandsPresets = {
  title: "Apply preset...",
  list: [],
};

export function updatePresetCommands() {
  if (DB.getSnapshot().presets.length > 0) {
    commandsPresets.list = [];

    DB.getSnapshot().presets.forEach((preset) => {
      let dis = preset.name;

      commandsPresets.list.push({
        id: "applyPreset" + preset.id,
        display: dis,
        exec: () => {
          PresetController.apply(preset.id);
          TestUI.updateModesNotice();
        },
      });
    });
  }
}

let commandsRepeatQuotes = {
  title: "Repeat quotes...",
  configKey: "repeatQuotes",
  list: [
    {
      id: "setRepeatQuotesOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setRepeatQuotes("off");
      },
    },
    {
      id: "setRepeatQuotesTyping",
      display: "typing",
      configValue: "typing",
      exec: () => {
        UpdateConfig.setRepeatQuotes("typing");
      },
    },
  ],
};

let commandsLiveWpm = {
  title: "Live wpm...",
  configKey: "showLiveWpm",
  list: [
    {
      id: "setLiveWpmOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowLiveWpm(false);
      },
    },
    {
      id: "setLiveWpmOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowLiveWpm(true);
      },
    },
  ],
};

let commandsLiveAcc = {
  title: "Live accuracy...",
  configKey: "showLiveAcc",
  list: [
    {
      id: "setLiveAccOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowLiveAcc(false);
      },
    },
    {
      id: "setLiveAccOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowLiveAcc(true);
      },
    },
  ],
};

let commandsLiveBurst = {
  title: "Live burst...",
  configKey: "showLiveBurst",
  list: [
    {
      id: "setLiveBurstOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowLiveBurst(false);
      },
    },
    {
      id: "setLiveBurstOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowLiveBurst(true);
      },
    },
  ],
};

let commandsShowTimer = {
  title: "Timer/progress...",
  configKey: "showTimerProgress",
  list: [
    {
      id: "setTimerProgressOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowTimerProgress(false);
      },
    },
    {
      id: "setTimerProgressOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowTimerProgress(true);
      },
    },
  ],
};

let commandsKeyTips = {
  title: "Key tips...",
  configKey: "showKeyTips",
  list: [
    {
      id: "setKeyTipsOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setShowKeyTips(false);
      },
    },
    {
      id: "setKeyTipsOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setShowKeyTips(true);
      },
    },
  ],
};

let commandsFreedomMode = {
  title: "Freedome mode...",
  configKey: "freedomMode",
  list: [
    {
      id: "setfreedomModeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setFreedomMode(false);
      },
    },
    {
      id: "setfreedomModeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setFreedomMode(true);
      },
    },
  ],
};

let commandsStrictSpace = {
  title: "Strict space...",
  configKey: "strictSpace",
  list: [
    {
      id: "setStrictSpaceOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setStrictSpace(false);
      },
    },
    {
      id: "setStrictSpaceOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setStrictSpace(true);
      },
    },
  ],
};

let commandsBlindMode = {
  title: "Blind mode...",
  configKey: "blindMode",
  list: [
    {
      id: "setBlindModeOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setBlindMode(false);
      },
    },
    {
      id: "setBlindModeOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setBlindMode(true);
      },
    },
  ],
};

let commandsShowWordsHistory = {
  title: "Always show words history...",
  configKey: "alwaysShowWordsHistory",
  list: [
    {
      id: "setAlwaysShowWordsHistoryOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setAlwaysShowWordsHistory(false);
      },
    },
    {
      id: "setAlwaysShowWordsHistoryOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setAlwaysShowWordsHistory(true);
      },
    },
  ],
};

let commandsOppositeShiftMode = {
  title: "Change opposite shift mode...",
  list: [
    {
      id: "setOppositeShiftModeOff",
      display: "off",
      exec: () => {
        UpdateConfig.setOppositeShiftMode("off");
      },
    },
    {
      id: "setOppositeShiftModeOn",
      display: "on",
      exec: () => {
        UpdateConfig.setOppositeShiftMode("on");
      },
    },
  ],
};

let commandsKeymapMode = {
  title: "Change keymap mode...",
  list: [
    {
      id: "setKeymapModeOff",
      display: "off",
      exec: () => {
        UpdateConfig.setKeymapMode("off");
      },
    },
    {
      id: "setKeymapModeStatic",
      display: "static",
      exec: () => {
        UpdateConfig.setKeymapMode("static");
      },
    },
    {
      id: "setKeymapModeNext",
      display: "next",
      exec: () => {
        UpdateConfig.setKeymapMode("next");
      },
    },
    {
      id: "setKeymapModeReact",
      display: "react",
      exec: () => {
        UpdateConfig.setKeymapMode("react");
      },
    },
  ],
};

let commandsSoundOnClick = {
  title: "Sound on click...",
  configKey: "playSoundOnClick",
  list: [
    {
      id: "setSoundOnClickOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("off");
      },
    },
    {
      id: "setSoundOnClick1",
      display: "1",
      configValue: "1",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("1");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick2",
      display: "2",
      configValue: "2",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("2");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick3",
      display: "3",
      configValue: "3",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("3");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
    {
      id: "setSoundOnClick4",
      display: "4",
      configValue: "4",
      exec: () => {
        UpdateConfig.setPlaySoundOnClick("4");
        Sound.playClick(Config.playSoundOnClick);
      },
    },
  ],
};

let commandsRandomTheme = {
  title: "Change random theme...",
  list: [
    {
      id: "setRandomOff",
      display: "off",
      exec: () => {
        UpdateConfig.setRandomTheme("off");
      },
    },
    {
      id: "setRandomOn",
      display: "on",
      exec: () => {
        UpdateConfig.setRandomTheme("on");
      },
    },
    {
      id: "setRandomFav",
      display: "fav",
      exec: () => {
        UpdateConfig.setRandomTheme("fav");
      },
    },
    {
      id: "setRandomLight",
      display: "light",
      exec: () => {
        UpdateConfig.setRandomTheme("light");
      },
    },
    {
      id: "setRandomDark",
      display: "dark",
      exec: () => {
        UpdateConfig.setRandomTheme("dark");
      },
    },
  ],
};

let commandsDifficulty = {
  title: "Change difficulty...",
  list: [
    {
      id: "setDifficultyNormal",
      display: "Normal",
      exec: () => {
        UpdateConfig.setDifficulty("normal");
      },
    },
    {
      id: "setDifficultyExpert",
      display: "Expert",
      exec: () => {
        UpdateConfig.setDifficulty("expert");
      },
    },
    {
      id: "setDifficultyMaster",
      display: "Master",
      exec: () => {
        UpdateConfig.setDifficulty("master");
      },
    },
  ],
};

export let commandsEnableAds = {
  title: "Set enable ads...",
  list: [
    {
      id: "setEnableAdsOff",
      display: "off",
      exec: () => {
        UpdateConfig.setEnableAds("off");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
    {
      id: "setEnableAdsOn",
      display: "on",
      exec: () => {
        UpdateConfig.setEnableAds("on");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
    {
      id: "setEnableMax",
      display: "Sellout",
      exec: () => {
        UpdateConfig.setEnableAds("max");
        Notifications.add("Don't forget to refresh the page!", 0);
      },
    },
  ],
};

let commandsCaretStyle = {
  title: "Change caret style...",
  list: [
    {
      id: "setCaretStyleOff",
      display: "off",
      exec: () => {
        UpdateConfig.setCaretStyle("off");
      },
    },
    {
      id: "setCaretStyleDefault",
      display: "line",
      exec: () => {
        UpdateConfig.setCaretStyle("default");
      },
    },
    {
      id: "setCaretStyleBlock",
      display: "block",
      exec: () => {
        UpdateConfig.setCaretStyle("block");
      },
    },
    {
      id: "setCaretStyleOutline",
      display: "outline-block",
      exec: () => {
        UpdateConfig.setCaretStyle("outline");
      },
    },
    {
      id: "setCaretStyleUnderline",
      display: "underline",
      exec: () => {
        UpdateConfig.setCaretStyle("underline");
      },
    },
    {
      id: "setCaretStyleCarrot",
      display: "carrot",
      visible: false,
      exec: () => {
        UpdateConfig.setCaretStyle("carrot");
      },
    },
    {
      id: "setCaretStyleBanana",
      display: "banana",
      visible: false,
      exec: () => {
        UpdateConfig.setCaretStyle("banana");
      },
    },
  ],
};

let commandsPaceCaretStyle = {
  title: "Change pace caret style...",
  list: [
    {
      id: "setPaceCaretStyleDefault",
      display: "line",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("default");
      },
    },
    {
      id: "setPaceCaretStyleBlock",
      display: "block",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("block");
      },
    },
    {
      id: "setPaceCaretStyleOutline",
      display: "outline-block",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("outline");
      },
    },
    {
      id: "setPaceCaretStyleUnderline",
      display: "underline",
      exec: () => {
        UpdateConfig.setPaceCaretStyle("underline");
      },
    },
    {
      id: "setPaceCaretStyleCarrot",
      display: "carrot",
      visible: false,
      exec: () => {
        UpdateConfig.setPaceCaretStyle("carrot");
      },
    },
    {
      id: "setPaceCaretStyleBanana",
      display: "banana",
      visible: false,
      exec: () => {
        UpdateConfig.setPaceCaretStyle("banana");
      },
    },
  ],
};

let commandsPaceCaret = {
  title: "Change pace caret mode...",
  list: [
    {
      id: "setPaceCaretOff",
      display: "off",
      exec: () => {
        UpdateConfig.setPaceCaret("off");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretPb",
      display: "pb",
      exec: () => {
        UpdateConfig.setPaceCaret("pb");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretAverage",
      display: "average",
      exec: () => {
        UpdateConfig.setPaceCaret("average");
        TestLogic.restart();
      },
    },
    {
      id: "setPaceCaretCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setPaceCaretCustomSpeed(input);
        UpdateConfig.setPaceCaret("custom");
        TestLogic.restart();
      },
    },
  ],
};

let commandsMinWpm = {
  title: "Change min wpm mode...",
  list: [
    {
      id: "setMinWpmOff",
      display: "off",
      exec: () => {
        UpdateConfig.setMinWpm("off");
      },
    },
    {
      id: "setMinWpmCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinWpmCustomSpeed(input);
        UpdateConfig.setMinWpm("custom");
      },
    },
  ],
};

let commandsMinAcc = {
  title: "Change min accuracy mode...",
  list: [
    {
      id: "setMinAccOff",
      display: "off",
      exec: () => {
        UpdateConfig.setMinAcc("off");
      },
    },
    {
      id: "setMinAccCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinAccCustom(input);
        UpdateConfig.setMinAcc("custom");
      },
    },
  ],
};

let commandsMinBurst = {
  title: "Change min burst mode...",
  list: [
    {
      id: "setMinBurstOff",
      display: "off",
      exec: () => {
        UpdateConfig.setMinBurst("off");
      },
    },
    {
      id: "setMinBurstFixed",
      display: "fixed",
      exec: () => {
        UpdateConfig.setMinBurst("fixed");
      },
    },
    {
      id: "setMinBurstFlex",
      display: "flex",
      exec: () => {
        UpdateConfig.setMinBurst("flex");
      },
    },
  ],
};

let commandsKeymapStyle = {
  title: "Change keymap style...",
  list: [
    {
      id: "setKeymapStyleStaggered",
      display: "staggered",
      exec: () => {
        UpdateConfig.setKeymapStyle("staggered");
      },
    },
    {
      id: "setKeymapStyleMatrix",
      display: "matrix",
      exec: () => {
        UpdateConfig.setKeymapStyle("matrix");
      },
    },
    {
      id: "setKeymapStyleSplit",
      display: "split",
      exec: () => {
        UpdateConfig.setKeymapStyle("split");
      },
    },
    {
      id: "setKeymapStyleSplitMatrix",
      display: "split matrix",
      exec: () => {
        UpdateConfig.setKeymapStyle("split_matrix");
      },
    },
  ],
};

let commandsKeymapLegendStyle = {
  title: "Change keymap legend style...",
  list: [
    {
      id: "setKeymapLegendStyleLowercase",
      display: "lowercase",
      exec: () => {
        UpdateConfig.setKeymapLegendStyle("lowercase");
      },
    },
    {
      id: "setKeymapLegendStyleUppercase",
      display: "uppercase",
      exec: () => {
        UpdateConfig.setKeymapLegendStyle("uppercase");
      },
    },
    {
      id: "setKeymapLegendStyleBlank",
      display: "blank",
      exec: () => {
        UpdateConfig.setKeymapLegendStyle("blank");
      },
    },
  ],
};

let commandsHighlightMode = {
  title: "Change highlight mode...",
  list: [
    {
      id: "setHighlightModeOff",
      display: "off",
      exec: () => {
        UpdateConfig.setHighlightMode("off");
      },
    },
    {
      id: "setHighlightModeLetter",
      display: "letter",
      exec: () => {
        UpdateConfig.setHighlightMode("letter");
      },
    },
    {
      id: "setHighlightModeWord",
      display: "word",
      exec: () => {
        UpdateConfig.setHighlightMode("word");
      },
    },
  ],
};

let commandsTimerStyle = {
  title: "Change timer/progress style...",
  list: [
    {
      id: "setTimerStyleBar",
      display: "bar",
      exec: () => {
        UpdateConfig.setTimerStyle("bar");
      },
    },
    {
      id: "setTimerStyleText",
      display: "text",
      exec: () => {
        UpdateConfig.setTimerStyle("text");
      },
    },
    {
      id: "setTimerStyleMini",
      display: "mini",
      exec: () => {
        UpdateConfig.setTimerStyle("mini");
      },
    },
  ],
};

let commandsTimerColor = {
  title: "Change timer/progress color...",
  list: [
    {
      id: "setTimerColorBlack",
      display: "black",
      exec: () => {
        UpdateConfig.setTimerColor("bar");
      },
    },
    {
      id: "setTimerColorSub",
      display: "sub",
      exec: () => {
        UpdateConfig.setTimerColor("sub");
      },
    },
    {
      id: "setTimerColorText",
      display: "text",
      exec: () => {
        UpdateConfig.setTimerColor("text");
      },
    },
    {
      id: "setTimerColorMain",
      display: "main",
      exec: () => {
        UpdateConfig.setTimerColor("main");
      },
    },
  ],
};

let commandsSingleListCommandLine = {
  title: "Single list command line...",
  list: [
    {
      id: "singleListCommandLineManual",
      display: "manual",
      exec: () => {
        UpdateConfig.setSingleListCommandLine("manual");
      },
    },
    {
      id: "singleListCommandLineOn",
      display: "on",
      exec: () => {
        UpdateConfig.setSingleListCommandLine("on");
      },
    },
  ],
};

let commandsTimerOpacity = {
  title: "Change timer opacity...",
  list: [
    {
      id: "setTimerOpacity.25",
      display: ".25",
      exec: () => {
        UpdateConfig.setTimerOpacity(0.25);
      },
    },
    {
      id: "setTimerOpacity.5",
      display: ".5",
      exec: () => {
        UpdateConfig.setTimerOpacity(0.5);
      },
    },
    {
      id: "setTimerOpacity.75",
      display: ".75",
      exec: () => {
        UpdateConfig.setTimerOpacity(0.75);
      },
    },
    {
      id: "setTimerOpacity1",
      display: "1",
      exec: () => {
        UpdateConfig.setTimerOpacity(1);
      },
    },
  ],
};

let commandsWordCount = {
  title: "Change word count...",
  configKey: "words",
  list: [
    {
      id: "changeWordCount10",
      display: "10",
      configValue: 10,
      exec: () => {
        UpdateConfig.setWordCount("10");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount25",
      display: "25",
      configValue: 25,
      exec: () => {
        UpdateConfig.setWordCount("25");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount50",
      display: "50",
      configValue: 50,
      exec: () => {
        UpdateConfig.setWordCount("50");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount100",
      display: "100",
      configValue: 100,
      exec: () => {
        UpdateConfig.setWordCount("100");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCount200",
      display: "200",
      configValue: 200,
      exec: () => {
        UpdateConfig.setWordCount("200");
        TestLogic.restart();
      },
    },
    {
      id: "changeWordCountCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setWordCount(input);
        TestLogic.restart();
      },
    },
  ],
};

let commandsQuoteLengthConfig = {
  title: "Change quote length...",
  configKey: "quoteLength",
  list: [
    {
      id: "changeQuoteLengthAll",
      display: "all",
      configValue: [0, 1, 2, 3],
      exec: () => {
        UpdateConfig.setQuoteLength([0, 1, 2, 3]);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthShort",
      display: "short",
      configValue: 0,
      configValueMode: "include",
      exec: () => {
        UpdateConfig.setQuoteLength(0);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthMedium",
      display: "medium",
      configValue: 1,
      configValueMode: "include",
      exec: () => {
        UpdateConfig.setQuoteLength(1);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthLong",
      display: "long",
      configValue: 2,
      configValueMode: "include",
      exec: () => {
        UpdateConfig.setQuoteLength(2);
        TestLogic.restart();
      },
    },
    {
      id: "changeQuoteLengthThicc",
      display: "thicc",
      configValue: 3,
      configValueMode: "include",
      exec: () => {
        UpdateConfig.setQuoteLength(3);
        TestLogic.restart();
      },
    },
  ],
};

let commandsPunctuation = {
  title: "Change punctuation...",
  configKey: "punctuation",
  list: [
    {
      id: "changePunctuationOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setPunctuation(true);
        TestLogic.restart();
      },
    },
    {
      id: "changePunctuationOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setPunctuation(false);
        TestLogic.restart();
      },
    },
  ],
};

let commandsNumbers = {
  title: "Numbers...",
  configKey: "numbers",
  list: [
    {
      id: "changeNumbersOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setNumbers(true);
        TestLogic.restart();
      },
    },
    {
      id: "changeNumbersOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setNumbers(false);
        TestLogic.restart();
      },
    },
  ],
};

let commandsSmoothCaret = {
  title: "Smooth caret...",
  configKey: "smoothCaret",
  list: [
    {
      id: "changeSmoothCaretOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setSmoothCaret(true);
      },
    },
    {
      id: "changeSmoothCaretOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setSmoothCaret(false);
      },
    },
  ],
};

let commandsQuickTab = {
  title: "Quick tab...",
  configKey: "quickTab",
  list: [
    {
      id: "changeQuickTabOn",
      display: "on",
      configValue: true,
      exec: () => {
        UpdateConfig.setQuickTabMode(true);
      },
    },
    {
      id: "changeQuickTabOff",
      display: "off",
      configValue: false,
      exec: () => {
        UpdateConfig.setQuickTabMode(false);
      },
    },
  ],
};

let commandsMode = {
  title: "Change mode...",
  configKey: "mode",
  list: [
    {
      id: "changeModeTime",
      display: "time",
      configValue: "time",
      exec: () => {
        UpdateConfig.setMode("time");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeWords",
      display: "words",
      configValue: "words",
      exec: () => {
        UpdateConfig.setMode("words");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeQuote",
      display: "quote",
      configValue: "quote",
      exec: () => {
        UpdateConfig.setMode("quote");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeCustom",
      display: "custom",
      configValue: "custom",
      exec: () => {
        UpdateConfig.setMode("custom");
        TestLogic.restart();
      },
    },
    {
      id: "changeModeZen",
      display: "zen",
      configValue: "zen",
      exec: () => {
        UpdateConfig.setMode("zen");
        ManualRestart.set();
        TestLogic.restart();
      },
    },
  ],
};

let commandsTimeConfig = {
  title: "Change time config...",
  configKey: "time",
  list: [
    {
      id: "changeTimeConfig15",
      display: "15",
      configValue: 15,
      exec: () => {
        UpdateConfig.setTimeConfig("15");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig30",
      display: "30",
      configValue: 30,
      exec: () => {
        UpdateConfig.setTimeConfig("30");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig60",
      display: "60",
      configValue: 60,
      exec: () => {
        UpdateConfig.setTimeConfig("60");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfig120",
      display: "120",
      configValue: 120,
      exec: () => {
        UpdateConfig.setTimeConfig("120");
        TestLogic.restart();
      },
    },
    {
      id: "changeTimeConfigCustom",
      display: "custom...",
      input: true,
      exec: (input) => {
        UpdateConfig.setTimeConfig(input);
        TestLogic.restart();
      },
    },
  ],
};

let commandsConfidenceMode = {
  title: "Confidence mode...",
  configKey: "confidenceMode",
  list: [
    {
      id: "changeConfidenceModeOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setConfidenceMode("off");
      },
    },
    {
      id: "changeConfidenceModeOn",
      display: "on",
      configValue: "on",
      exec: () => {
        UpdateConfig.setConfidenceMode("on");
      },
    },
    {
      id: "changeConfidenceModeMax",
      display: "max",
      configValue: "max",
      exec: () => {
        UpdateConfig.setConfidenceMode("max");
      },
    },
  ],
};

let commandsStopOnError = {
  title: "Stop on error...",
  configKey: "stopOnError",
  list: [
    {
      id: "changeStopOnErrorOff",
      display: "off",
      configValue: "off",
      exec: () => {
        UpdateConfig.setStopOnError("off");
      },
    },
    {
      id: "changeStopOnErrorLetter",
      display: "letter",
      configValue: "letter",
      exec: () => {
        UpdateConfig.setStopOnError("letter");
      },
    },
    {
      id: "changeStopOnErrorWord",
      display: "word",
      configValue: "word",
      exec: () => {
        UpdateConfig.setStopOnError("word");
      },
    },
  ],
};

let commandsFontSize = {
  title: "Change font size...",
  list: [
    {
      id: "changeFontSize1",
      display: "1x",
      exec: () => {
        UpdateConfig.setFontSize(1);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize125",
      display: "1.25x",
      exec: () => {
        UpdateConfig.setFontSize(125);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize15",
      display: "1.5x",
      exec: () => {
        UpdateConfig.setFontSize(15);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize2",
      display: "2x",
      exec: () => {
        UpdateConfig.setFontSize(2);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize3",
      display: "3x",
      exec: () => {
        UpdateConfig.setFontSize(3);
        TestLogic.restart();
      },
    },
    {
      id: "changeFontSize4",
      display: "4x",
      exec: () => {
        UpdateConfig.setFontSize(4);
        TestLogic.restart();
      },
    },
  ],
};

let commandsPageWidth = {
  title: "Change page width...",
  list: [
    {
      id: "setPageWidth100",
      display: "100",
      exec: () => {
        UpdateConfig.setPageWidth("100");
      },
    },
    {
      id: "setPageWidth125",
      display: "125",
      exec: () => {
        UpdateConfig.setPageWidth("125");
      },
    },
    {
      id: "setPageWidth150",
      display: "150",
      exec: () => {
        UpdateConfig.setPageWidth("150");
      },
    },
    {
      id: "setPageWidth200",
      display: "200",
      exec: () => {
        UpdateConfig.setPageWidth("200");
      },
    },
    {
      id: "setPageWidthMax",
      display: "max",
      exec: () => {
        UpdateConfig.setPageWidth("max");
      },
    },
  ],
};

export let themeCommands = {
  title: "Change theme...",
  list: [],
};

Misc.getThemesList().then((themes) => {
  themes.forEach((theme) => {
    themeCommands.list.push({
      id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
      display: theme.name.replace(/_/g, " "),
      hover: () => {
        // previewTheme(theme.name);
        ThemeController.preview(theme.name);
      },
      exec: () => {
        UpdateConfig.setTheme(theme.name);
      },
    });
  });
});

// export function showFavouriteThemesAtTheTop() {
export function updateThemeCommands() {
  if (Config.favThemes.length > 0) {
    themeCommands.list = [];
    Config.favThemes.forEach((theme) => {
      themeCommands.list.push({
        id: "changeTheme" + Misc.capitalizeFirstLetter(theme),
        display: theme.replace(/_/g, " "),
        hover: () => {
          // previewTheme(theme);
          ThemeController.preview(theme);
        },
        exec: () => {
          UpdateConfig.setTheme(theme);
        },
      });
    });
    Misc.getThemesList().then((themes) => {
      themes.forEach((theme) => {
        if (Config.favThemes.includes(theme.name)) return;
        themeCommands.list.push({
          id: "changeTheme" + Misc.capitalizeFirstLetter(theme.name),
          display: theme.name.replace(/_/g, " "),
          hover: () => {
            // previewTheme(theme.name);
            ThemeController.preview(theme.name);
          },
          exec: () => {
            UpdateConfig.setTheme(theme.name);
          },
        });
      });
    });
  }
}

let commandsCopyWordsToClipboard = {
  title: "Are you sure...",
  list: [
    {
      id: "copyNo",
      display: "Nevermind",
      exec: () => {},
    },
    {
      id: "copyYes",
      display: "Yes, I am sure",
      exec: () => {
        const words = Misc.getWords();

        navigator.clipboard.writeText(words).then(
          () => {
            Notifications.add("Copied to clipboard", 1);
          },
          () => {
            Notifications.add("Failed to copy!", -1);
          }
        );
      },
    },
  ],
};

let commandsMonkeyPowerLevel = {
  title: "Power mode...",
  list: [
    {
      id: "monkeyPowerLevelOff",
      display: "off",
      exec: () => UpdateConfig.setMonkeyPowerLevel("off"),
    },
    {
      id: "monkeyPowerLevel1",
      display: "mellow",
      exec: () => UpdateConfig.setMonkeyPowerLevel("1"),
    },
    {
      id: "monkeyPowerLevel2",
      display: "high",
      exec: () => UpdateConfig.setMonkeyPowerLevel("2"),
    },
    {
      id: "monkeyPowerLevel3",
      display: "ultra",
      exec: () => UpdateConfig.setMonkeyPowerLevel("3"),
    },
    {
      id: "monkeyPowerLevel4",
      display: "over 9000",
      exec: () => UpdateConfig.setMonkeyPowerLevel("4"),
    },
  ],
};

export let defaultCommands = {
  title: "",
  list: [
    {
      id: "changePunctuation",
      display: "Punctuation...",
      subgroup: commandsPunctuation,
      icon: "!?",
      // exec: () => {
      //   UpdateConfig.togglePunctuation();
      //   TestLogic.restart();
      // },
    },
    {
      id: "changeMode",
      display: "Mode...",
      icon: "fa-bars",
      subgroup: commandsMode,
    },
    {
      id: "changeTimeConfig",
      display: "Time...",
      icon: "fa-clock",
      subgroup: commandsTimeConfig,
    },
    {
      id: "changeWordCount",
      display: "Words...",
      alias: "words",
      icon: "fa-font",
      subgroup: commandsWordCount,
    },
    {
      id: "changeQuoteLength",
      display: "Quote length...",
      icon: "fa-quote-right",
      alias: "quotes",
      subgroup: commandsQuoteLengthConfig,
    },
    {
      visible: false,
      id: "changeTags",
      display: "Change tags...",
      subgroup: true,
      exec: () => {
        updateTagCommands();
        current.push(commandsTags);
        Commandline.show();
      },
    },
    {
      visible: false,
      id: "applyPreset",
      display: "Apply preset...",
      subgroup: true,
      exec: () => {
        updatePresetCommands();
        current.push(commandsPresets);
        Commandline.show();
      },
    },
    {
      id: "changeConfidenceMode",
      display: "Confidence mode...",
      icon: "fa-backspace",
      subgroup: commandsConfidenceMode,
    },
    {
      id: "changeStopOnError",
      display: "Stop on error...",
      icon: "fa-hand-paper",
      subgroup: commandsStopOnError,
    },
    {
      id: "changeSoundOnClick",
      display: "Sound on click...",
      icon: "fa-volume-up",
      subgroup: commandsSoundOnClick,
    },
    {
      id: "changeNumbers",
      display: "Numbers...",
      icon: "15",
      subgroup: commandsNumbers,
    },
    {
      id: "changeSmoothCaret",
      display: "Smooth caret...",
      icon: "fa-i-cursor",
      subgroup: commandsSmoothCaret,
    },
    {
      id: "changeQuickTab",
      display: "Quick tab...",
      icon: "fa-redo-alt",
      subgroup: commandsQuickTab,
    },
    {
      id: "changeRepeatQuotes",
      display: "Repeat quotes...",
      icon: "fa-sync-alt",
      subgroup: commandsRepeatQuotes,
    },
    {
      id: "changeLiveWpm",
      display: "Live wpm...",
      icon: "fa-tachometer-alt",
      subgroup: commandsLiveWpm,
    },
    {
      id: "changeLiveAcc",
      display: "Live accuracy...",
      icon: "fa-percentage",
      subgroup: commandsLiveAcc,
    },
    {
      id: "changeLiveBurst",
      display: "Live burst...",
      icon: "fa-fire-alt",
      subgroup: commandsLiveBurst,
    },
    {
      id: "changeShowTimer",
      display: "Timer/progress...",
      icon: "fa-clock",
      subgroup: commandsShowTimer,
    },
    {
      id: "changeKeyTips",
      display: "Key tips...",
      icon: "fa-question",
      subgroup: commandsKeyTips,
    },
    {
      id: "changeFreedomMode",
      display: "Freedome mode...",
      subgroup: commandsFreedomMode,
    },
    {
      id: "changeStrictSpace",
      display: "Strict space...",
      icon: "fa-minus",
      subgroup: commandsStrictSpace,
    },
    {
      id: "changeBlindMode",
      display: "Blind mode...",
      icon: "fa-eye-slash",
      subgroup: commandsBlindMode,
    },
    {
      id: "changeShowWordsHistory",
      display: "Always show words history...",
      icon: "fa-align-left",
      subgroup: commandsShowWordsHistory,
    },
    {
      id: "toggleIndicateTypos",
      display: "Toggle indicate typos",
      exec: () => {
        UpdateConfig.toggleIndicateTypos();
      },
    },
    {
      id: "toggleHideExtraLetters",
      display: "Toggle hide extra letters",
      exec: () => {
        UpdateConfig.toggleHideExtraLetters();
      },
    },
    {
      id: "toggleQuickEnd",
      display: "Toggle quick end",
      exec: () => {
        UpdateConfig.toggleQuickEnd();
      },
    },
    {
      id: "singleListCommandLine",
      display: "Single list command line...",
      subgroup: true,
      exec: () => {
        current.push(commandsSingleListCommandLine);
        Commandline.show();
      },
    },
    {
      id: "changeMinWpm",
      display: "Change min wpm mode...",
      alias: "minimum",
      subgroup: true,
      exec: () => {
        current.push(commandsMinWpm);
        Commandline.show();
      },
    },
    {
      id: "changeMinAcc",
      display: "Change min accuracy mode...",
      alias: "minimum",
      subgroup: true,
      exec: () => {
        current.push(commandsMinAcc);
        Commandline.show();
      },
    },
    {
      id: "changeMinBurst",
      display: "Change min burst mode...",
      alias: "minimum",
      subgroup: true,
      exec: () => {
        current.push(commandsMinBurst);
        Commandline.show();
      },
    },
    {
      id: "changeMinBurstSpeed",
      display: "Change min burst speed...",
      alias: "minimum",
      input: true,
      exec: (input) => {
        UpdateConfig.setMinBurstCustomSpeed(input);
      },
    },
    {
      id: "changeOppositeShiftMode",
      display: "Change opposite shift mode...",
      subgroup: true,
      exec: () => {
        current.push(commandsOppositeShiftMode);
        Commandline.show();
      },
    },
    {
      id: "togglePlaySoundOnError",
      display: "Toggle play sound on error",
      exec: () => {
        UpdateConfig.togglePlaySoundOnError();
      },
    },
    {
      id: "toggleFlipTestColors",
      display: "Toggle flip test colors",
      exec: () => {
        UpdateConfig.toggleFlipTestColors();
      },
    },
    {
      id: "toggleSmoothLineScroll",
      display: "Toggle smooth line scroll",
      exec: () => {
        UpdateConfig.toggleSmoothLineScroll();
      },
    },
    {
      id: "toggleAlwaysShowDecimalPlaces",
      display: "Toggle always show decimal places",
      exec: () => {
        UpdateConfig.toggleAlwaysShowDecimalPlaces();
      },
    },
    {
      id: "toggleAlwaysShowCPM",
      display: "Toggle always show CPM",
      exec: () => {
        UpdateConfig.toggleAlwaysShowCPM();
      },
    },
    {
      id: "toggleStartGraphsAtZero",
      display: "Toggle start graphs at zero",
      exec: () => {
        UpdateConfig.toggleStartGraphsAtZero();
      },
    },
    {
      id: "toggleSwapEscAndTab",
      display: "Toggle swap esc and tab",
      exec: () => {
        UpdateConfig.toggleSwapEscAndTab();
      },
    },
    {
      id: "toggleShowAllLines",
      display: "Toggle show all lines",
      exec: () => {
        UpdateConfig.toggleShowAllLines();
      },
    },
    {
      id: "toggleColorfulMode",
      display: "Toggle colorful mode",
      exec: () => {
        UpdateConfig.toggleColorfulMode();
      },
    },
    {
      id: "toggleShowOutOfFocusWarning",
      display: "Toggle out of focus warning",
      exec: () => {
        UpdateConfig.toggleShowOutOfFocusWarning();
      },
    },
    {
      id: "setEnableAds",
      display: "Set enable ads...",
      subgroup: true,
      exec: () => {
        current.push(commandsEnableAds);
        Commandline.show();
      },
    },
    {
      id: "toggleCustomTheme",
      display: "Toggle preset/custom theme",
      exec: () => {
        UpdateConfig.toggleCustomTheme();
      },
    },
    {
      id: "changeDifficulty",
      display: "Change difficulty...",
      subgroup: true,
      exec: () => {
        current.push(commandsDifficulty);
        Commandline.show();
      },
    },
    {
      id: "changeCaretStyle",
      display: "Change caret style...",
      subgroup: true,
      exec: () => {
        current.push(commandsCaretStyle);
        Commandline.show();
      },
    },
    {
      id: "changePaceCaret",
      display: "Change pace caret mode...",
      subgroup: true,
      exec: () => {
        current.push(commandsPaceCaret);
        Commandline.show();
      },
    },
    {
      id: "changePaceCaretStyle",
      display: "Change pace caret style...",
      subgroup: true,
      exec: () => {
        current.push(commandsPaceCaretStyle);
        Commandline.show();
      },
    },
    {
      id: "toggleRepeatedPace",
      display: "Toggle repeated pace",
      exec: () => {
        UpdateConfig.toggleRepeatedPace();
      },
    },
    {
      id: "changeTimerStyle",
      display: "Change timer/progress style...",
      subgroup: true,
      exec: () => {
        current.push(commandsTimerStyle);
        Commandline.show();
      },
    },
    {
      id: "changeTimerColor",
      display: "Change timer/progress color...",
      subgroup: true,
      exec: () => {
        current.push(commandsTimerColor);
        Commandline.show();
      },
    },
    {
      id: "changeTimerOpacity",
      display: "Change timer/progress opacity...",
      subgroup: true,
      exec: () => {
        current.push(commandsTimerOpacity);
        Commandline.show();
      },
    },
    {
      id: "changeHighlightMode",
      display: "Change highlight mode...",
      subgroup: true,
      exec: () => {
        current.push(commandsHighlightMode);
        Commandline.show();
      },
    },
    {
      id: "changeCustomBackground",
      display: "Change custom background...",
      defaultValue: "",
      input: true,
      exec: (input) => {
        UpdateConfig.setCustomBackground(input);
      },
    },
    {
      id: "changeTheme",
      display: "Change theme...",
      subgroup: true,
      exec: () => {
        current.push(themeCommands);
        Commandline.show();
      },
    },
    {
      id: "changeRandomTheme",
      display: "Change random theme...",
      subgroup: true,
      exec: () => {
        current.push(commandsRandomTheme);
        Commandline.show();
      },
    },
    {
      id: "changeLanguage",
      display: "Change language...",
      subgroup: true,
      exec: () => {
        current.push(commandsLanguages);
        Commandline.show();
      },
    },
    {
      id: "changeFunbox",
      display: "Change funbox...",
      alias: "fun box",
      subgroup: true,
      exec: () => {
        current.push(commandsFunbox);
        Commandline.show();
      },
    },
    {
      id: "toggleCapsLockBackspace",
      display: "Toggle caps lock backspace",
      exec: () => {
        UpdateConfig.toggleCapsLockBackspace();
      },
    },
    {
      id: "changeLayout",
      display: "Change layout...",
      subgroup: true,
      exec: () => {
        current.push(commandsLayouts);
        Commandline.show();
      },
    },
    {
      id: "toggleKeymap",
      display: "Change keymap mode...",
      subgroup: true,
      alias: "keyboard",
      exec: () => {
        current.push(commandsKeymapMode);
        Commandline.show();
      },
    },
    {
      id: "changeKeymapStyle",
      display: "Change keymap style...",
      alias: "keyboard",
      subgroup: true,
      exec: () => {
        current.push(commandsKeymapStyle);
        Commandline.show();
      },
    },
    {
      id: "changeKeymapLegendStyle",
      display: "Change keymap legend style...",
      alias: "keyboard",
      subgroup: true,
      exec: () => {
        current.push(commandsKeymapLegendStyle);
        Commandline.show();
      },
    },
    {
      id: "changeKeymapLayout",
      display: "Change keymap layout...",
      alias: "keyboard",
      subgroup: true,
      exec: () => {
        current.push(commandsKeymapLayouts);
        Commandline.show();
      },
    },
    {
      id: "changeCustomLayoutfluid",
      display: "Change custom layoutfluid...",
      defaultValue: "qwerty dvorak colemak",
      input: true,
      exec: (input) => {
        UpdateConfig.setCustomLayoutfluid(input);
        if (Config.funbox === "layoutfluid") TestLogic.restart();
        // UpdateConfig.setLayout(
        //   Config.customLayoutfluid
        //     ? Config.customLayoutfluid.split("_")[0]
        //     : "qwerty"
        // );
        // UpdateConfig.setKeymapLayout(
        //   Config.customLayoutfluid
        //     ? Config.customLayoutfluid.split("_")[0]
        //     : "qwerty"
        // );
      },
    },
    {
      id: "changeFontSize",
      display: "Change font size...",
      subgroup: true,
      exec: () => {
        current.push(commandsFontSize);
        Commandline.show();
      },
    },
    {
      id: "changeFontFamily",
      display: "Change font family...",
      subgroup: true,
      exec: () => {
        current.push(commandsFonts);
        Commandline.show();
      },
    },
    {
      id: "changePageWidth",
      display: "Change page width...",
      subgroup: true,
      exec: () => {
        current.push(commandsPageWidth);
        Commandline.show();
      },
    },
    {
      id: "randomizeTheme",
      display: "Next random theme",
      exec: () => ThemeController.randomizeTheme(),
    },
    {
      id: "viewTypingPage",
      display: "View Typing Page",
      alias: "start begin type test",
      exec: () => $("#top #menu .icon-button.view-start").click(),
    },
    {
      id: "viewLeaderboards",
      display: "View Leaderboards Page",
      exec: () => $("#top #menu .icon-button.view-leaderboards").click(),
    },
    {
      id: "viewAbout",
      display: "View About Page",
      exec: () => $("#top #menu .icon-button.view-about").click(),
    },
    {
      id: "viewSettings",
      display: "View Settings Page",
      exec: () => $("#top #menu .icon-button.view-settings").click(),
    },
    {
      id: "viewAccount",
      display: "View Account Page",
      alias: "stats",
      exec: () =>
        $("#top #menu .icon-button.view-account").hasClass("hidden")
          ? $("#top #menu .icon-button.view-login").click()
          : $("#top #menu .icon-button.view-account").click(),
    },
    {
      id: "toggleFullscreen",
      display: "Toggle Fullscreen",
      exec: () => {
        Misc.toggleFullscreen();
      },
    },
    {
      id: "bailOut",
      display: "Bail out...",
      subgroup: true,
      visible: false,
      exec: () => {
        current.push({
          title: "Are you sure...",
          list: [
            {
              id: "bailOutNo",
              display: "Nevermind",
              exec: () => {},
              available: () => {
                return canBailOut();
              },
            },
            {
              id: "bailOutForSure",
              display: "Yes, I am sure",
              exec: () => {
                TestLogic.setBailout(true);
                TestLogic.finish();
              },
              available: () => {
                return canBailOut();
              },
            },
          ],
        });
        Commandline.show();
      },
      available: () => {
        return canBailOut();
      },
    },
    {
      id: "joinDiscord",
      display: "Join the Discord server",
      exec: () => {
        window.open("https://discord.gg/monkeytype");
      },
    },
    {
      id: "repeatTest",
      display: "Repeat test",
      exec: () => {
        TestLogic.restart(true);
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "practiceMissedWords",
      display: "Practice missed words",
      exec: () => {
        PractiseMissed.init();
      },
      available: () => {
        return (
          TestUI.resultVisible && Object.keys(TestStats.missedWords).length > 0
        );
      },
    },
    {
      id: "toggleWordHistory",
      display: "Toggle word history",
      exec: () => {
        TestUI.toggleResultWords();
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "saveScreenshot",
      display: "Save screenshot",
      alias: "ss picture",
      exec: () => {
        setTimeout(() => {
          TestUI.screenshot();
        }, 500);
      },
      available: () => {
        return TestUI.resultVisible;
      },
    },
    {
      id: "changeCustomModeText",
      display: "Change custom text",
      exec: () => {
        CustomTextPopup.show();
      },
    },
    {
      id: "toggleMonkey",
      display: "Toggle Monkey",
      visible: false,
      exec: () => {
        UpdateConfig.toggleMonkey();
      },
    },
    {
      id: "copyWordsToClipboard",
      display: "Copy words to clipboard",
      subgroup: true,
      exec: () => {
        current.push(commandsCopyWordsToClipboard);
        Commandline.show();
      },
    },
    {
      id: "importSettingsJSON",
      display: "Import settings JSON",
      input: true,
      exec: (input) => {
        try {
          UpdateConfig.apply(JSON.parse(input));
          UpdateConfig.saveToLocalStorage();
          Settings.update();
          Notifications.add("Done", 1);
        } catch (e) {
          Notifications.add(
            "An error occured while importing settings: " + e,
            -1
          );
        }
      },
    },
    {
      id: "exportSettingsJSON",
      display: "Export settings JSON",
      input: true,
      defaultValue: "",
      exec: (input) => {},
    },
    {
      id: "monkeyPower",
      display: "Power mode...",
      alias: "powermode",
      visible: false,
      subgroup: true,
      exec: () => {
        current.push(commandsMonkeyPowerLevel);
        Commandline.show();
      },
    },
  ],
};

current = [defaultCommands];

export function setCurrent(val) {
  current = val;
}

export function pushCurrent(val) {
  current.push(val);
}

export function getList(list) {
  return eval(list);
}
