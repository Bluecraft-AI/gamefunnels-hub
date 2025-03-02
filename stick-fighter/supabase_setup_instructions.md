# Supabase Setup Instructions for Stick Fighter Game

This guide will walk you through setting up your Supabase project to work with the Stick Fighter game's match results tracking system.

## Step 1: Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one already.
2. Once logged in, click on "New Project" to create a new project.
3. Give your project a name (e.g., "Stick Fighter Game") and set a secure database password.
4. Choose a region closest to your target audience for better performance.
5. Click "Create new project" and wait for it to be created (this may take a few minutes).

## Step 2: Set Up the Database

1. Once your project is created, navigate to the SQL Editor in the Supabase dashboard.
2. Click on "New Query" to create a new SQL query.
3. Copy and paste the entire contents of the `setup_supabase.sql` file into the SQL editor.
4. Click "Run" to execute the SQL commands. This will:
   - Create the `match_results` table
   - Set up appropriate indexes
   - Create a view for easier querying
   - Set up row-level security policies
   - Create helper functions for statistics

## Step 3: Get Your Supabase URL and Anon Key

1. In your Supabase dashboard, go to the "Settings" icon in the left sidebar.
2. Click on "API" in the settings menu.
3. Under "Project URL", you'll find your Supabase URL. Copy this value.
4. Under "Project API keys", find the "anon" key (public) and copy this value.

## Step 4: Update Your Game Code

1. Open your `sketch.js` file.
2. Find these lines near the top of the file (around line 5-6):
   ```javascript
   const supabaseUrl = 'https://zjtizhqbbombulphelwb.supabase.co';
   const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdGl6aHFiYm9tYnVscGhlbHdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzU5NjIsImV4cCI6MjA1NjUxMTk2Mn0.fSd8LlvSxwPTgcY1p-k6GHk9IUMkYxDDyPzCvEnoU-Y';
   ```
3. Replace them with your actual Supabase URL and anon key:
   ```javascript
   const supabaseUrl = 'https://your-actual-project-id.supabase.co';
   const supabaseKey = 'your-actual-anon-key';
   ```

**Important:** The email collection feature will not work without your own Supabase project. The existing keys in the code are for demonstration purposes only and may be deactivated at any time.

## Step 5: Test Your Integration

1. Open your game in a web browser.
2. Play a match until completion.
3. Enter an email address and submit the results.
4. Check your Supabase dashboard under "Table Editor" > "match_results" to verify that the data was saved correctly.

## Step 6 (Optional): Set Up Email Notifications

The SQL setup includes a placeholder for sending emails. To actually send emails with match results:

1. You can use Supabase Edge Functions with an email service like SendGrid, Mailgun, or AWS SES.
2. Alternatively, you can use a third-party service to handle the email sending.

Here's a simple approach using Supabase Edge Functions:

1. Install the Supabase CLI if you haven't already.
2. Create a new Edge Function:
   ```bash
   supabase functions new send-match-email
   ```
3. Implement the function to send emails using your preferred email service.
4. Deploy the function:
   ```bash
   supabase functions deploy send-match-email
   ```
5. Update the database trigger to call your Edge Function.

## Troubleshooting

If you encounter issues with the Supabase integration:

1. Check the browser console for any error messages.
2. Verify that your Supabase URL and anon key are correct.
3. Make sure your Supabase project is active and not in maintenance mode.
4. Check that the `match_results` table was created correctly.
5. Ensure that the Row Level Security policies are not blocking your inserts.

## Advanced Usage

The setup includes a function to get player statistics. You can call this from your application to display player stats:

```sql
SELECT * FROM get_player_stats('player@example.com');
```

This will return comprehensive statistics for the player with the specified email address.

## Security Considerations

- The current setup allows anonymous inserts, which is necessary for the game to work without user authentication.
- Users can only view their own match results through the RLS policy.
- For a production environment, consider adding additional security measures like rate limiting. 