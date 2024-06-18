// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::process::{Command, Stdio};
use std::path::PathBuf;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let resource_path: PathBuf;
      if cfg!(debug_assertions) {
        // Entwicklungsmodus
        resource_path = PathBuf::from("../server.js");
      } else {
        // Produktionsmodus
        resource_path = app
          .path_resolver()
          .resolve_resource("server.js")
          .expect("failed to resolve resource");
      }

      println!("Resolved server.js path: {:?}", resource_path);

      let server_process = Command::new("node")
        .arg(resource_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to start server");

      app.manage(server_process);

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
