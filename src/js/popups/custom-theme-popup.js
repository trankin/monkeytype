// import Config, * as UpdateConfig from "./config";
// import * as Notifications from "./notifications";
// import * as ThemePicker from "./theme-picker";

export function show(value) {
  if ($("#customThemeShareWrapper").hasClass("hidden")) {
    // let save = [];
    // $.each(
    //   $(".pageSettings .section.customTheme [type='color']"),
    //   (index, element) => {
    //     save.push($(element).attr("value"));
    //   }
    // );
    // $("#customThemeShareWrapper input").val(JSON.stringify(save));
    $("#customThemeShareWrapper input").val(value);
    $("#customThemeShareWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, (e) => {
        $("#customThemeShare input").focus();
        $("#customThemeShare input").select();
        $("#customThemeShare input").focus();
      });
  }
}

function hide() {
  if (!$("#customThemeShareWrapper").hasClass("hidden")) {
    // try {
    //   UpdateConfig.setCustomThemeColors(
    //     JSON.parse($("#customThemeShareWrapper input").val())
    //   );
    // } catch (e) {
    //   Notifications.add(
    //     "Something went wrong. Reverting to default custom colors.",
    //     0,
    //     4
    //   );
    //   UpdateConfig.setCustomThemeColors(Config.defaultConfig.customThemeColors);
    // }
    // ThemePicker.setCustomInputs();
    $("#customThemeShareWrapper input").val("");
    $("#customThemeShareWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        (e) => {
          $("#customThemeShareWrapper").addClass("hidden");
        }
      );
  }
}

$("#customThemeShareWrapper").click((e) => {
  if ($(e.target).attr("id") === "customThemeShareWrapper") {
    hide();
  }
});

$("#customThemeShare .button").click((e) => {
  hide();
});
