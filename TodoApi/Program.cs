using TodoApi;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

// שורה חיונית למניעת שיבוש שמות השדות בטוקן
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// 1. הגדרת מסד הנתונים
var connectionString = builder.Configuration.GetConnectionString("ToDoDB");
builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. הגדרת JWT (מפתח סודי)
var key = Encoding.ASCII.GetBytes("YourSuperSecretKeyThatIsAtLeast32CharsLong!"); 

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

// --- ניתובי משימות (Items) ---

// שליפה - תיקון שגיאת ה-Delegate ע"י החזרת Results.Ok
app.MapGet("/items", async (ToDoDbContext db, HttpContext context) => {
    var userIdClaim = context.User.FindFirst("id");
    if (userIdClaim == null) return Results.Unauthorized();
    
    var userId = int.Parse(userIdClaim.Value);
    var items = await db.Items.Where(i => i.UserId == userId).ToListAsync();
    
    return Results.Ok(items); // חובה להשתמש ב-Results.Ok כדי שכל הנתיבים יחזירו IResult
}).RequireAuthorization();

app.MapPost("/items", async (ToDoDbContext db, Item newItem, HttpContext context) => {
    var userIdClaim = context.User.FindFirst("id");
    if (userIdClaim == null) return Results.Unauthorized();

    newItem.UserId = int.Parse(userIdClaim.Value);
    db.Items.Add(newItem);
    await db.SaveChangesAsync();
    return Results.Created($"/items/{newItem.Id}", newItem);
}).RequireAuthorization();

app.MapPut("/items/{id}", async (ToDoDbContext db, int id, Item inputItem, HttpContext context) => {
    var userIdClaim = context.User.FindFirst("id");
    if (userIdClaim == null) return Results.Unauthorized();
    var userId = int.Parse(userIdClaim.Value);

    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();
    
    item.Name = inputItem.Name;
    item.IsComplete = inputItem.IsComplete;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/items/{id}", async (ToDoDbContext db, int id, HttpContext context) => {
    var userIdClaim = context.User.FindFirst("id");
    if (userIdClaim == null) return Results.Unauthorized();
    var userId = int.Parse(userIdClaim.Value);

    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null) return Results.NotFound();
    
    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.Ok(item);
}).RequireAuthorization();

// --- ניתובי אימות (Auth) ---

app.MapPost("/register", async (ToDoDbContext db, User newUser) => {
    var exists = await db.Users.AnyAsync(u => u.Username == newUser.Username);
    if (exists) return Results.BadRequest("משתמש כבר קיים");
    
    newUser.Password = BCrypt.Net.BCrypt.HashPassword(newUser.Password);
    db.Users.Add(newUser);
    await db.SaveChangesAsync();
    return Results.Ok();
});

app.MapPost("/login", async (ToDoDbContext db, User loginData) => {
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == loginData.Username);
    if (user == null || !BCrypt.Net.BCrypt.Verify(loginData.Password, user.Password))
        return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[] { new Claim("id", user.Id.ToString()) }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new { token = tokenHandler.WriteToken(token) });
});
app.MapGet("/categories", async (ToDoDbContext db, HttpContext context) => {
    var userId = int.Parse(context.User.FindFirst("id")!.Value);
    return Results.Ok(await db.Categories.Where(c => c.UserId == userId).ToListAsync());
}).RequireAuthorization();

app.MapPost("/categories", async (ToDoDbContext db, Category category, HttpContext context) => {
    category.UserId = int.Parse(context.User.FindFirst("id")!.Value);
    db.Categories.Add(category);
    await db.SaveChangesAsync();
    return Results.Created($"/categories/{category.Id}", category);
}).RequireAuthorization();
app.Run();