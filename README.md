# Supabase Notes App with Pokémon Theme

A single-page web application for managing notes with Supabase as the backend. Features include user authentication, real-time updates, Pokémon-themed design elements, category filtering, dark/light mode, and drag-and-drop functionality.

## Features

- 🔐 **User Authentication**: Sign up and login with email and password
- 📝 **Note Management**: Create, edit, and delete notes
- 🎮 **Pokémon Themes**: Notes themed with different Pokémon types
- 🏷️ **Enhanced Categories**: Visually appealing category filtering with animations
- 🔍 **Search**: Find notes by title or content
- 🌓 **Improved Dark/Light Mode**: Optimized contrast and text visibility in both modes
- 🔄 **Real-time Updates**: Changes sync instantly across devices
- 📋 **Export Notes**: Download your notes as JSON
- 🖱️ **Drag and Drop**: Reorder notes with drag and drop
- ✨ **Visual Animations**: Smooth transitions, hover effects, and interactive UI elements

## Recent Updates

### v2.0 - Pokémon Theme Enhancement

- **Pokémon Integration**: 
  - Notes are now themed based on different Pokémon types (Pikachu, Bulbasaur, Charmander, Squirtle, Jigglypuff)
  - Each Pokémon type has unique colors and visual effects
  - Pokémon sprites appear on note cards

- **Visual Improvements**:
  - Enhanced category dropdowns with animations and visual cues
  - Improved empty state visuals with category-specific emojis
  - Added staggered animations for filtered notes
  - Optimized all text elements for better visibility in both light and dark modes

- **Performance Enhancements**:
  - Removed sound effects and audio-related code for better performance
  - Cleaned up unused functions and code
  - Optimized animations for smoother experience

## Deployment on GitHub Pages

### Automatic Deployment
This app is automatically deployed on GitHub Pages: [View Live Demo](https://yourusername.github.io/notes-app/)

### Manual Deployment Steps

1. **Fork or clone this repository**
   ```
   git clone https://github.com/yourusername/notes-app.git
   cd notes-app
   ```

2. **Configure GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Select the main branch as the source
   - Click Save

3. **Push your changes**
   ```
   git add .
   git commit -m "Update app for GitHub Pages"
   git push
   ```

4. **Access your deployed app**
   - Your app will be available at `https://yourusername.github.io/notes-app/`
   - It may take a few minutes for changes to appear after pushing

### Important Notes for Deployment

- Since GitHub Pages is a static hosting service, the Supabase backend functionality will only work if you've properly configured your Supabase project with the correct CORS settings.
- In your Supabase project dashboard, go to Settings > API > CORS and add your GitHub Pages URL to the allowed origins.

## Setup Instructions

### 1. Create a Supabase Project

1. Sign up for a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Once the project is created, note your project URL and anon key (found in Project Settings > API)

### 2. Set Up the Database

1. In your Supabase dashboard, go to the SQL Editor
2. Create the `notes` table with the following SQL:

```sql
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own notes
CREATE POLICY "Users can access own notes" ON notes
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Add a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that calls update_updated_at_column() when a row is updated
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for the notes table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

### 3. Configure Your App

1. Open `script.js` and replace the Supabase configuration with your project details:

```javascript
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 4. Run the App

The app is built with vanilla HTML, CSS, and JavaScript, so you can:

1. Open `index.html` in a web browser, or
2. Use a local development server:
   - Install [Node.js](https://nodejs.org/)
   - Install a simple server: `npm install -g http-server`
   - Navigate to the project folder and run: `http-server`
   - Open `http://localhost:8080` in your browser

## User Guide

### Authentication

- Use the sign-up form to create a new account
- Once registered, log in with your email and password
- Or try out the app in Guest Mode without signing up

### Creating Notes

- Click the "+ New Note" button
- Enter a title, content, select a category, and choose a Pokémon theme
- Click "Save Note"

### Managing Notes

- Click on any note to edit it
- Use the delete button in the edit modal to remove a note
- Filter notes by category using the enhanced dropdown in the top bar
- Search notes by typing in the search bar
- Drag and drop notes to reorder them

### Categories

The app now supports five categories, each with a unique emoji:
- 💼 Work
- 🏠 Personal
- 💡 Ideas
- 📚 Study
- 🍎 Health

### Pokémon Themes

Choose from these Pokémon themes for your notes:
- Pikachu (Electric type) - Yellow theme
- Bulbasaur (Grass type) - Green theme
- Charmander (Fire type) - Orange theme
- Squirtle (Water type) - Blue theme
- Jigglypuff (Fairy type) - Pink theme

### Exporting Notes

- Click the download button in the top right corner to export all your notes as a JSON file

### Appearance

- Toggle between dark and light mode using the theme button in the top bar
- Both modes are now optimized for text visibility and contrast

## Technology Stack

- **Frontend**: HTML, CSS, and vanilla JavaScript
- **Backend**: Supabase (PostgreSQL database, Auth, Realtime)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Real-time Updates**: Supabase Realtime API
- **Theme**: Pokémon-inspired design with custom animations 