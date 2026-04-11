# שלב הבנייה
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# העתקת קובץ הפרויקט מהתיקייה הנוכחית
COPY ["TodoApi.csproj", "./"]
RUN dotnet restore

# העתקת שאר הקבצים
COPY . .
RUN dotnet publish -c Release -o /app

# שלב ההרצה
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "TodoApi.dll"]
