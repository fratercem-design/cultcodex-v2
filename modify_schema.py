import sys
import os

schema_path = r'prisma/schema.prisma'
with open(schema_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the index of the line where model SeasonalEvent starts
for i, line in enumerate(lines):
    if line.strip() == 'model SeasonalEvent {':
        # Insert before this line
        # We need to add the CardGift model and a newline before
        insert_lines = [
            '\n',
            'model CardGift {\n',
            '  id            String   @id @default(cuid())\n',
            '  token         String   @unique\n',
            '  cardId        String\n',
            '  serial        Int\n',
            '  edition       String   @default("founders")\n',
            '  note          String?\n',
            '  claimed       Boolean  @default(false)\n',
            '  claimedAt     DateTime?\n',
            '  claimedBy     String?\n',
            '  createdAt     DateTime @default(now())\n',
            '\n',
            '  card          Card     @relation(fields: [cardId], references: [id])\n',
            '  \n',
            '  @@index([cardId])\n',
            '  @@unique([cardId, edition, serial])\n',
            '}\n',
            '\n'
        ]
        # Insert the lines at position i
        lines[i:i] = insert_lines
        break

# Now also add the relation to Card model
# Find the model Card { line and then after the packCards line, add cardGifts
for i, line in enumerate(lines):
    if line.strip() == 'model Card {':
        # Find the line with packCards
        for j in range(i, len(lines)):
            if 'packCards' in lines[j] and 'PackCard[]' in lines[j]:
                # Insert after this line
                indent = len(lines[j]) - len(lines[j].lstrip())
                spaces = ' ' * indent
                lines.insert(j+1, f'{spaces}cardGifts   CardGift[] @relation("cardGifts")\n')
                break
        break

with open(schema_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Schema updated successfully.')
