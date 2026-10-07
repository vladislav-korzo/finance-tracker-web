use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};

/// Show, unminimize and focus the main window.
fn show_main(app: &tauri::AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
  }
}

/// Builds the native application menu (macOS menu bar). Custom items carry an
/// id that is forwarded to the web frontend via the "menu" event.
fn build_app_menu(app: &tauri::App) -> tauri::Result<()> {
  let app_menu = SubmenuBuilder::new(app, "Учёт")
    .about(None)
    .separator()
    .item(
      &MenuItemBuilder::with_id("settings", "Настройки…")
        .accelerator("CmdOrCtrl+,")
        .build(app)?,
    )
    .separator()
    .hide()
    .hide_others()
    .show_all()
    .separator()
    .quit()
    .build()?;

  let file_menu = SubmenuBuilder::new(app, "Файл")
    .item(
      &MenuItemBuilder::with_id("new-transaction", "Новая операция")
        .accelerator("CmdOrCtrl+N")
        .build(app)?,
    )
    .separator()
    .close_window()
    .build()?;

  let edit_menu = SubmenuBuilder::new(app, "Правка")
    .undo()
    .redo()
    .separator()
    .cut()
    .copy()
    .paste()
    .select_all()
    .build()?;

  let view_menu = SubmenuBuilder::new(app, "Вид")
    .item(
      &MenuItemBuilder::with_id("command-palette", "Поиск…")
        .accelerator("CmdOrCtrl+K")
        .build(app)?,
    )
    .separator()
    .item(&MenuItemBuilder::with_id("nav:/", "Дашборд").accelerator("CmdOrCtrl+1").build(app)?)
    .item(
      &MenuItemBuilder::with_id("nav:/transactions", "Транзакции")
        .accelerator("CmdOrCtrl+2")
        .build(app)?,
    )
    .item(
      &MenuItemBuilder::with_id("nav:/analytics", "Аналитика")
        .accelerator("CmdOrCtrl+3")
        .build(app)?,
    )
    .item(
      &MenuItemBuilder::with_id("nav:/wallets", "Кошельки")
        .accelerator("CmdOrCtrl+4")
        .build(app)?,
    )
    .item(
      &MenuItemBuilder::with_id("nav:/categories", "Категории")
        .accelerator("CmdOrCtrl+5")
        .build(app)?,
    )
    .item(&MenuItemBuilder::with_id("nav:/budget", "Бюджет").accelerator("CmdOrCtrl+6").build(app)?)
    .item(&MenuItemBuilder::with_id("nav:/credits", "Кредиты").accelerator("CmdOrCtrl+7").build(app)?)
    .separator()
    .fullscreen()
    .build()?;

  let window_menu = SubmenuBuilder::new(app, "Окно").minimize().maximize().build()?;

  let menu = MenuBuilder::new(app)
    .item(&app_menu)
    .item(&file_menu)
    .item(&edit_menu)
    .item(&view_menu)
    .item(&window_menu)
    .build()?;

  app.set_menu(menu)?;
  Ok(())
}

/// System tray icon with a small action menu. Lives in the macOS menu bar so the
/// app stays available after the window is closed.
fn build_tray(app: &tauri::App) -> tauri::Result<()> {
  let tray_menu = MenuBuilder::new(app)
    .item(&MenuItemBuilder::with_id("tray-open", "Открыть Учёт").build(app)?)
    .item(&MenuItemBuilder::with_id("tray-new", "Новая операция").build(app)?)
    .separator()
    .item(&PredefinedMenuItem::quit(app, Some("Выйти"))?)
    .build()?;

  let mut builder = TrayIconBuilder::with_id("main-tray")
    .tooltip("Учёт")
    .menu(&tray_menu)
    .show_menu_on_left_click(false)
    .on_menu_event(|app, event| match event.id().0.as_str() {
      "tray-open" => show_main(app),
      "tray-new" => {
        show_main(app);
        let _ = app.emit("menu", "new-transaction");
      }
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        show_main(tray.app_handle());
      }
    });

  if let Some(icon) = app.default_window_icon() {
    builder = builder.icon(icon.clone());
  }
  builder.build(app)?;
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      build_app_menu(app)?;
      build_tray(app)?;

      // Closing the window hides it to the tray instead of quitting the app.
      if let Some(window) = app.get_webview_window("main") {
        let hidden = window.clone();
        window.on_window_event(move |event| {
          if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = hidden.hide();
          }
        });
      }
      Ok(())
    })
    .on_menu_event(|app, event| {
      let id = event.id().0.clone();
      // "settings" is special-cased to the settings route; everything else is
      // already a route ("nav:/…") or a frontend action id.
      let action = if id == "settings" { "nav:/settings".to_string() } else { id };
      let _ = app.emit("menu", action);
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
