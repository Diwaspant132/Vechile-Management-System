import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
  const db = await open({ filename: 'ntc_vms.db', driver: sqlite3.Database });
  const users = await db.all("SELECT id, username, first_name, last_name, phone_number, branch FROM users WHERE role = 'DRIVER'");
  console.log('USERS:', users);
  const drivers = await db.all("SELECT id, first_name, last_name, phone_number, current_branch FROM drivers");
  console.log('DRIVERS:', drivers);
})();
