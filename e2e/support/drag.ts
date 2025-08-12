export async function dragBy(page, locator, dx, dy) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + 10 + dy);
  await page.mouse.up();
}
