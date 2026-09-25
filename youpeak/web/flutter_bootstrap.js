{{flutter_js}}
{{flutter_build_config}}

// Render into #app instead of the whole page so index.html can keep the app
// in a phone-width column on desktop screens.
_flutter.loader.load({
  onEntrypointLoaded: async function (engineInitializer) {
    const appRunner = await engineInitializer.initializeEngine({
      hostElement: document.getElementById("app"),
    });
    await appRunner.runApp();

    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.opacity = "0";
      setTimeout(function () { loading.remove(); }, 250);
    }
  },
});
