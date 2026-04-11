using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace TodoApi;

public partial class ToDoDbContext : DbContext
{
    public ToDoDbContext() { }

    public ToDoDbContext(DbContextOptions<ToDoDbContext> options)
        : base(options) { }

    public virtual DbSet<Item> Items { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Category> Categories { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_general_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("items");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.IsComplete).HasColumnName("isComplete");
            
            // הוספת המיפוי לשדה userId - זה מה שיפתור את ה-0 במסד!
            entity.Property(e => e.UserId).HasColumnName("userId"); 
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable("users");
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Username).HasMaxLength(50).HasColumnName("username");
            entity.Property(e => e.Password).HasMaxLength(255).HasColumnName("password");
        });

// בתוך OnModelCreating:
modelBuilder.Entity<Category>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.ToTable("categories");
    entity.Property(e => e.Name).HasMaxLength(50).HasColumnName("name");
    entity.Property(e => e.UserId).HasColumnName("userId");
});
    }
    
}