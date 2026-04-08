export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to gutted. - Know your gut.",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to gutted.</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="background:linear-gradient(to right, #00B4B4, #4ADE80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:32px;font-weight:bold;margin:0;">
        Welcome to gutted., ${name}
      </h1>
      <p style="color:#a3a3a3;margin:16px 0 0 0;font-size:16px;">Your gut health journey starts now.</p>
    </div>

    <!-- Steps -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:32px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px 0;">Get started in 3 steps:</h2>
      <div style="margin:24px 0;">
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <span style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;margin-right:12px;font-size:14px;">1</span>
          <span style="color:#ffffff;">Complete your gut health profile</span>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <span style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;margin-right:12px;font-size:14px;">2</span>
          <span style="color:#ffffff;">Voice-log how you feel today</span>
        </div>
        <div style="display:flex;align-items:center;">
          <span style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;margin-right:12px;font-size:14px;">3</span>
          <span style="color:#ffffff;">Upload a gut test for your personalized meal plan</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://gutted.app/dashboard" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        Open gutted. →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:14px;margin:0;">gutted. is not a medical service. Always consult a healthcare professional for medical advice.</p>
      <p style="color:#525252;font-size:12px;margin:8px 0 0 0;">© 2026 gutted. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  }),

  weeklyMealPlan: (name: string, mealPlanUrl: string) => ({
    subject: "🍽️ Your weekly gut-friendly meal plan is ready",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Weekly Meal Plan</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>
    
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 8px 0;">
        🍽️ Your meal plan is ready, ${name}
      </h1>
      <p style="color:#a3a3a3;margin:0;font-size:16px;">7 days of gut-friendly meals, personalized for you</p>
    </div>

    <div style="background:linear-gradient(135deg, rgba(0,180,180,0.1) 0%, rgba(74,222,128,0.1) 100%);border:1px solid rgba(0,180,180,0.2);border-radius:16px;padding:32px;margin-bottom:32px;">
      <p style="color:#ffffff;margin:0 0 16px 0;font-size:16px;">This week's plan is based on your gut profile and recent logs. Each meal is designed to support your digestive health goals.</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${mealPlanUrl}" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;display:inline-block;">
          View This Week's Plan →
        </a>
      </div>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:14px;margin:0;">gutted. is not a medical service. Always consult a healthcare professional for medical advice.</p>
    </div>
  </div>
</body>
</html>`
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "Reset your gutted. password",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>
    
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 16px 0;">Reset your password</h1>
      <p style="color:#a3a3a3;margin:0;font-size:16px;">Click the button below to create a new password for your gutted. account.</p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${resetUrl}" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        Reset Password →
      </a>
    </div>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="color:#a3a3a3;font-size:14px;margin:0;">If you didn't request this password reset, you can ignore this email. Your password won't be changed.</p>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;margin:0;">© 2026 gutted. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  }),

  monthlyReport: (name: string, currentAvg: number, prevAvg: number, logCount: number, highlights: string) => ({
    subject: `Your monthly gut health report: ${currentAvg}/10 ${currentAvg > prevAvg ? '📈' : currentAvg < prevAvg ? '📉' : '📊'}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monthly Gut Health Report</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 8px 0;">
        Monthly Report, ${name}
      </h1>
      <p style="color:#a3a3a3;font-size:14px;">Here's how your gut health shaped up this month.</p>
    </div>

    <div style="background:linear-gradient(135deg, rgba(0,180,180,0.1) 0%, rgba(74,222,128,0.1) 100%);border:1px solid rgba(0,180,180,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
      <div style="display:flex;justify-content:center;gap:40px;text-align:center;margin-bottom:20px;">
        <div>
          <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px 0;">This Month</p>
          <p style="background:linear-gradient(to right, #00B4B4, #4ADE80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:36px;font-weight:bold;margin:0;">${currentAvg}</p>
        </div>
        <div>
          <p style="color:#a3a3a3;font-size:12px;margin:0 0 4px 0;">Last Month</p>
          <p style="color:#ffffff;font-size:36px;font-weight:bold;margin:0;opacity:0.4;">${prevAvg || '-'}</p>
        </div>
      </div>
      ${prevAvg > 0 ? `<p style="text-align:center;color:${currentAvg >= prevAvg ? '#4ADE80' : '#EF4444'};font-size:14px;margin:0;">
        ${currentAvg > prevAvg ? `↑ Up ${Math.round((currentAvg - prevAvg) * 10) / 10} points - nice improvement!` : currentAvg < prevAvg ? `↓ Down ${Math.round((prevAvg - currentAvg) * 10) / 10} points - let's work on this` : 'Holding steady'}
      </p>` : ''}
      <p style="text-align:center;color:#a3a3a3;font-size:14px;margin:12px 0 0 0;">${logCount} logs recorded this month</p>
    </div>

    ${highlights ? `
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:16px;margin:0 0 16px 0;">Highlights</h2>
      <p style="color:#a3a3a3;font-size:14px;line-height:1.8;margin:0;white-space:pre-line;">${highlights}</p>
    </div>
    ` : ''}

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://gutted.app/dashboard/report" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        View Full Report →
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;margin:0;">Sent monthly to Pro members. <a href="https://gutted.app/dashboard/settings" style="color:#525252;text-decoration:underline;">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`
  }),

  weeklyDigest: (name: string, avgScore: number, logCount: number, trend: string, change: number) => ({
    subject: `Your weekly gut score: ${avgScore}/10 ${trend === 'up' ? '📈' : trend === 'down' ? '📉' : '📊'}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weekly Gut Health Digest</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 8px 0;">
        Your Week in Review, ${name}
      </h1>
    </div>

    <div style="background:linear-gradient(135deg, rgba(0,180,180,0.1) 0%, rgba(74,222,128,0.1) 100%);border:1px solid rgba(0,180,180,0.2);border-radius:16px;padding:32px;margin-bottom:24px;text-align:center;">
      <p style="color:#a3a3a3;font-size:14px;margin:0 0 8px 0;">Average gut score</p>
      <p style="background:linear-gradient(to right, #00B4B4, #4ADE80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:48px;font-weight:bold;margin:0;">
        ${avgScore}/10
      </p>
      ${trend !== 'new' && change > 0 ? `
      <p style="color:${trend === 'up' ? '#4ADE80' : '#EF4444'};font-size:14px;margin:8px 0 0 0;">
        ${trend === 'up' ? '↑' : '↓'} ${change} from last week
      </p>` : ''}
      <p style="color:#a3a3a3;font-size:14px;margin:12px 0 0 0;">${logCount} log${logCount !== 1 ? 's' : ''} this week</p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <p style="color:#a3a3a3;font-size:16px;margin:0 0 20px 0;">
        ${avgScore >= 7 ? 'Great week! Your gut health is looking strong.' : avgScore >= 4 ? 'Room for improvement. Check your patterns for insights.' : 'Tough week. Review your trigger foods and meal plan.'}
      </p>
      <a href="https://gutted.app/dashboard" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        View Full Dashboard →
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;margin:0;">Sent weekly to all paid gutted. members. <a href="https://gutted.app/dashboard/settings" style="color:#525252;text-decoration:underline;">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`
  }),

  dailyReminder: (name: string) => ({
    subject: "How's your gut today? Time for a quick log",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Gut Check-In</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>

    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 8px 0;">
        Hey ${name}, how's your gut today?
      </h1>
      <p style="color:#a3a3a3;margin:0;font-size:16px;">A quick 30-second log keeps your streak alive and helps us spot patterns.</p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://gutted.app/dashboard/log" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        Log now →
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;margin:0;">You're receiving this because you enabled daily reminders. <a href="https://gutted.app/dashboard/settings" style="color:#525252;text-decoration:underline;">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`
  }),

  'payment-failed': (name: string) => ({
    subject: "Action needed: your gutted. payment failed",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Failed</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>
    
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0 0 16px 0;">
        Payment failed, ${name}
      </h1>
      <p style="color:#a3a3a3;margin:0;font-size:16px;">We couldn't process your latest subscription payment. Please update your payment method to keep your premium features active.</p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://gutted.app/dashboard/settings" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        Update Payment Method →
      </a>
    </div>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="color:#a3a3a3;font-size:14px;margin:0;">If your payment isn't updated, your account will be downgraded to the free plan when your subscription lapses. Your data won't be deleted.</p>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;margin:0;">© 2026 gutted. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  }),

  upgrade: (name: string, plan: string) => ({
    subject: `🎉 Welcome to gutted. ${plan}!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to gutted. ${plan}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>
    
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="background:linear-gradient(to right, #00B4B4, #4ADE80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:32px;font-weight:bold;margin:0;">
        🎉 Welcome to ${plan}, ${name}!
      </h1>
      <p style="color:#a3a3a3;margin:16px 0 0 0;font-size:16px;">You now have access to premium gut health features.</p>
    </div>

    <div style="background:linear-gradient(135deg, rgba(0,180,180,0.1) 0%, rgba(74,222,128,0.1) 100%);border:1px solid rgba(0,180,180,0.2);border-radius:16px;padding:32px;margin-bottom:32px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 16px 0;">What's unlocked:</h2>
      <div style="margin:20px 0;">
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="color:#4ADE80;margin-right:8px;">✓</span>
          <span style="color:#ffffff;">Unlimited voice logging & document uploads</span>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="color:#4ADE80;margin-right:8px;">✓</span>
          <span style="color:#ffffff;">Weekly AI-generated meal plans</span>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="color:#4ADE80;margin-right:8px;">✓</span>
          <span style="color:#ffffff;">Advanced gut health analytics</span>
        </div>
        ${plan === 'Pro' ? `
        <div style="display:flex;align-items:center;margin-bottom:12px;">
          <span style="color:#4ADE80;margin-right:8px;">✓</span>
          <span style="color:#ffffff;">PDF health reports</span>
        </div>
        <div style="display:flex;align-items:center;">
          <span style="color:#4ADE80;margin-right:8px;">✓</span>
          <span style="color:#ffffff;">Priority AI analysis</span>
        </div>
        ` : ''}
      </div>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://gutted.app/dashboard" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        Explore Your New Features →
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;margin:0;">© 2026 gutted. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
  })
}